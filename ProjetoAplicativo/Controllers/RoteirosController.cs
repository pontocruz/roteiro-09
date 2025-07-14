// FILE: RoteirosControllers.cs
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoAplicativo.Data;
using ProjetoAplicativo.Helpers;
using ProjetoAplicativo.Models;
using static ProjetoAplicativo.Models.Enums.EnumInstrucao;
namespace ProjetoAplicativo.Controllers
{
    public class RoteirosController : Controller
    {
        private readonly ModeloEntidades _context; public RoteirosController(ModeloEntidades context) { _context = context; }

        public async Task<IActionResult> EditaRoteiro(int? id)
        {
            if (id == null || _context.Cena == null) { return NotFound(); }
            var cena = await _context.Cena.Include(c => c.Instrucoes).ThenInclude(i => i.InstrucoesPersonagens).ThenInclude(ins => ins.Personagem).FirstOrDefaultAsync(c => c.Id == id);
            if (cena == null) { return NotFound(); }
            ViewBag.Personagens = await _context.PecaPersonagem.Where(ps => ps.PecaId == cena.PecaId).Select(ps => new { ps.Personagem.Id, ps.Personagem.Nome }).ToListAsync();
            cena.Instrucoes = cena.Instrucoes?.OrderBy(i => i.OrdemCronologica).ToList(); return View(cena);
        }


        #region MENTION 

        [HttpGet]
        public async Task<IActionResult> GetPersonagensForMentions(int cenaId) // Add cenaId parameter
        {
            // First get the PecaId for the current Cena
            var pecaId = await _context.Cena
                .Where(c => c.Id == cenaId)
                .Select(c => c.PecaId)
                .FirstOrDefaultAsync();

            if (pecaId == 0)
            {
                return Json(new List<object>()); // Return empty if no Peca found
            }

            // Get personagens filtered by PecaId
            var personagens = await _context.PecaPersonagem
                .Where(ps => ps.PecaId == pecaId)
                .Select(ps => new { ps.Personagem.Id, ps.Personagem.Nome })
                .ToListAsync();

            return Json(personagens);
        }

        private List<int> ExtractMentionedPersonagemIds(string text)
        {
            // Handle null/empty cases immediately
            if (string.IsNullOrEmpty(text))
            {
                return new List<int>();
            }

            var mentions = new List<int>();
            try
            {
                var matches = Regex.Matches(text, @"@\[(\d+)\|");
                foreach (Match match in matches)
                {
                    if (match.Success && int.TryParse(match.Groups[1].Value, out var personagemId))
                    {
                        mentions.Add(personagemId);
                    }
                }
            }
            catch (Exception ex)
            {
                // Log regex errors if needed
                Console.WriteLine($"Mention extraction error: {ex.Message}");
            }

            return mentions.Distinct().ToList();
        }

        public static string ParseMentionsToButtons(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            return Regex.Replace(text, @"@\[(\d+)\|([^\]]+)\]",
                match => $"<button class='mention-btn' data-personagem-id='{match.Groups[1].Value}'>{match.Groups[2].Value}</button>");
        }

        #endregion MENTION 


        #region POSTS 

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateInstrucao([FromForm] int CenaId, [FromForm] TipoDeInstrucao TipoDeInstrucao, [FromForm] string? Texto, [FromForm] List<int>? personagemIds = null)
        {
            var ordem = await GetNextOrderNumber(CenaId);

            var (success, html, error) = await CreateInstructionCoreAsync(
                    CenaId, TipoDeInstrucao, Texto, ordem, personagemIds);
            return Json(new { success, html = success ? html : null, error = !success ? error : null });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> InsertInstrucao([FromForm] int CenaId, [FromForm] TipoDeInstrucao TipoDeInstrucao, [FromForm] string Texto, [FromForm] int OrdemCronologica = 0, [FromForm] List<int>? personagemIds = null, [FromForm] int referenceId = 0, [FromForm] string insertPosition = "below")
        {
            try
            {
                var reference = await _context.Instrucao.FirstOrDefaultAsync(i => i.Id == referenceId);
                int newOrder = insertPosition == "above" ? reference.OrdemCronologica : reference.OrdemCronologica + 1;
                var instructionsToUpdate = await _context.Instrucao.Where(i => i.CenaId == CenaId && i.OrdemCronologica >= newOrder).ToListAsync();
                instructionsToUpdate.ForEach(i => i.OrdemCronologica++);
                await _context.SaveChangesAsync();
                var (success, html, error) = await CreateInstructionCoreAsync(CenaId, TipoDeInstrucao, Texto, newOrder, personagemIds);
                return Json(new { success, html = success ? html : null, error = !success ? error : null });
            }
            catch (Exception ex) { return Json(new { success = false, error = ex.Message }); }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditInstrucao([FromForm] int Id, [FromForm] TipoDeInstrucao TipoDeInstrucao, [FromForm] string Texto, [FromForm] int OrdemCronologica, [FromForm] List<int>? personagemIds = null)
        {
            try
            {
                var instrucao = await _context.Instrucao.Include(i => i.InstrucoesPersonagens).ThenInclude(ins => ins.Personagem).FirstOrDefaultAsync(i => i.Id == Id);
                if (instrucao == null) { return Json(new { success = false, error = "Instrução não encontrada" }); }
                instrucao.TipoDeInstrucao = TipoDeInstrucao; instrucao.Texto = Texto; instrucao.OrdemCronologica = OrdemCronologica;
                await HandlePersonagens(instrucao.Id, personagemIds, clearExisting: true);
                await _context.SaveChangesAsync();
                _context.Entry(instrucao).State = EntityState.Detached;
                var result = await _context.Instrucao.AsNoTracking().Include(i => i.InstrucoesPersonagens).ThenInclude(ins => ins.Personagem).FirstOrDefaultAsync(i => i.Id == instrucao.Id);
                var html = await this.RenderViewToStringAsync("_InstrucaoRow", result);
                return Json(new { success = true, html });
            }
            catch (Exception ex) { return Json(new { success = false, error = ex.Message, stackTrace = ex.StackTrace }); }
        }

        [HttpPost]
        public async Task<IActionResult> ReorderInstructions(int cenaId, Dictionary<int, int> newOrder)
        {
            try
            {
                var instructions = await _context.Instrucao.Where(i => i.CenaId == cenaId).ToListAsync();
                foreach (var instruction in instructions) { if (newOrder.TryGetValue(instruction.Id, out var newOrderNum)) { instruction.OrdemCronologica = newOrderNum; } }
                await _context.SaveChangesAsync(); return Json(new { success = true });
            }
            catch (Exception ex) { return Json(new { success = false, error = ex.Message }); }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeletaInstrucao([FromBody] DeleteInstructionRequest request)
        {
            try
            {
                // Get the instruction to be deleted
                var instrucao = await _context.Instrucao
                    .Include(i => i.InstrucoesPersonagens)
                    .FirstOrDefaultAsync(i => i.Id == request.Id);

                if (instrucao == null)
                {
                    return Json(new { success = false, message = "Instrução não encontrada" });
                }

                // Store the order of the deleted instruction
                int deletedOrder = instrucao.OrdemCronologica;
                int cenaId = instrucao.CenaId;

                // Remove related records
                _context.InstrucaoPersonagem.RemoveRange(instrucao.InstrucoesPersonagens);
                _context.Instrucao.Remove(instrucao);

                // Get all instructions in the same scene with higher order
                var instructionsToUpdate = await _context.Instrucao
                    .Where(i => i.CenaId == cenaId && i.OrdemCronologica > deletedOrder)
                    .ToListAsync();

                // Decrement their order numbers
                foreach (var instruction in instructionsToUpdate)
                {
                    instruction.OrdemCronologica--;
                }

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    newOrder = deletedOrder  // Return the position that was deleted
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Erro ao excluir instrução",
                    detail = ex.Message
                });
            }
        }
        public class DeleteInstructionRequest
        {
            public int Id { get; set; }
        }


        #endregion POSTS 


        #region SHARED PRIVATE METHODS

        private async Task<(bool Success, string Html, string Error)>
            CreateInstructionCoreAsync(int cenaId, TipoDeInstrucao tipo, string? texto, int ordem, List<int>? executorIds)
        {
            try
            {
                var instrucao = new Instrucao
                {
                    CenaId = cenaId,
                    TipoDeInstrucao = tipo,
                    Texto = texto,
                    OrdemCronologica = ordem
                };
                _context.Add(instrucao);
                await _context.SaveChangesAsync();

                if (executorIds != null)
                {
                    await HandlePersonagens(instrucao.Id, executorIds, clearExisting: true);
                }

                var mentionedIds = ExtractMentionedPersonagemIds(texto);
                await HandleMentionedPersonagens(instrucao.Id, mentionedIds);

                var result = await LoadInstructionWithRelations(instrucao.Id);
                var html = await this.RenderViewToStringAsync("_InstrucaoRow", result);
                return (true, html, null);
            }
            catch (Exception ex)
            {
                return (false, null, ex.Message);
            }
        }

        private async Task HandlePersonagens(int instrucaoId, List<int>? personagemIds, bool clearExisting = false)
        {
            if (clearExisting)
            {
                // Clear ONLY Executor/Exceto personagens (not Citado)
                await _context.InstrucaoPersonagem
                    .Where(x => x.InstrucaoId == instrucaoId &&
                               (x.TipoDeParticipacao == TipoDeParticipacao.Executor ||
                                x.TipoDeParticipacao == TipoDeParticipacao.Exceto))
                    .ExecuteDeleteAsync();
            }
            if (personagemIds == null || !personagemIds.Any()) return;
            if (personagemIds.Contains(-1))
            {
                await _context.InstrucaoPersonagem.AddAsync(new InstrucaoPersonagem
                {
                    InstrucaoId = instrucaoId,
                    ShowAll = true,
                    TipoDeParticipacao = TipoDeParticipacao.Executor
                });
            }
            else if (personagemIds.Contains(-2))
            {
                foreach (var personagemId in personagemIds.Where(id => id > 0))
                {
                    await _context.InstrucaoPersonagem.AddAsync(new InstrucaoPersonagem
                    {
                        InstrucaoId = instrucaoId,
                        ShowAllExcept = true,
                        PersonagemId = personagemId,
                        TipoDeParticipacao = TipoDeParticipacao.Exceto
                    });
                }
            }
            else
            {
                foreach (var personagemId in personagemIds.Where(id => id > 0))
                {
                    await _context.InstrucaoPersonagem.AddAsync(new InstrucaoPersonagem { InstrucaoId = instrucaoId, PersonagemId = personagemId, TipoDeParticipacao = TipoDeParticipacao.Executor });
                }
            }
            await _context.SaveChangesAsync();
        }

        private async Task HandleMentionedPersonagens(int instrucaoId, List<int> mentionedIds)
        {
            if (mentionedIds == null || !mentionedIds.Any()) return;
            await _context.InstrucaoPersonagem
                .Where(x => x.InstrucaoId == instrucaoId && x.TipoDeParticipacao == TipoDeParticipacao.Citado)
                .ExecuteDeleteAsync();
            foreach (var personagemId in mentionedIds)
            {
                await _context.InstrucaoPersonagem.AddAsync(new InstrucaoPersonagem
                {
                    InstrucaoId = instrucaoId,
                    PersonagemId = personagemId,
                    TipoDeParticipacao = TipoDeParticipacao.Citado
                });
            }
            await _context.SaveChangesAsync();
        }

        private async Task<Instrucao> LoadInstructionWithRelations(int id)
        {
            return await _context.Instrucao
                .Include(i => i.InstrucoesPersonagens
                    .Where(ins => ins.TipoDeParticipacao == TipoDeParticipacao.Executor ||
                                  ins.TipoDeParticipacao == TipoDeParticipacao.Exceto))
                .ThenInclude(ins => ins.Personagem)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        private async Task<int> GetNextOrderNumber(int cenaId)
        {
            var lastOrder = await _context.Instrucao.Where(i => i.CenaId == cenaId).OrderByDescending(i => i.OrdemCronologica).Select(i => i.OrdemCronologica).FirstOrDefaultAsync();
            return lastOrder + 1;
        }

        #endregion SHARED PRIVATE METHODS


        #region OUTROS

        [HttpGet]
        public async Task<IActionResult> GetRowTemplate(int id)
        {
            var instrucao = await _context.Instrucao.Include(i => i.InstrucoesPersonagens).ThenInclude(ins => ins.Personagem).FirstOrDefaultAsync(i => i.Id == id);
            return PartialView("_InstrucaoRow", instrucao);
        }
        [HttpGet]
        public async Task<IActionResult> GetInstrucao(int id)
        {
            var instrucao = await _context.Instrucao.Include(i => i.InstrucoesPersonagens).ThenInclude(ins => ins.Personagem).FirstOrDefaultAsync(i => i.Id == id);
            if (instrucao == null) return NotFound();
            return Json(new
            {
                id = instrucao.Id,
                cenaId = instrucao.CenaId,
                tipo = instrucao.TipoDeInstrucao,
                texto = instrucao.Texto,
                ordem = instrucao.OrdemCronologica,
                personagemIds = instrucao.InstrucoesPersonagens.Select(ins => ins.PersonagemId).ToArray(),
                instrucoesPersonagens = instrucao.InstrucoesPersonagens.Select(ins => new
                { showAll = ins.ShowAll, showAllExcept = ins.ShowAllExcept, personagemId = ins.PersonagemId }).ToList()
            });
        }
        [HttpGet]
        public async Task<IActionResult> CheckForDuplicates(int instrucaoId, int personagemId, TipoDeParticipacao tipo)
        {
            var exists = await _context.InstrucaoPersonagem.AnyAsync(x => x.InstrucaoId == instrucaoId && x.PersonagemId == personagemId && x.TipoDeParticipacao == tipo);
            return Json(new { isDuplicate = exists });
        }
        #endregion OUTROS 

        #region MOVE

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MoveInstructionUp([FromBody] MoveInstructionRequest request)
        {
            return await MoveInstruction(request, Direction.Up);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MoveInstructionDown([FromBody] MoveInstructionRequest request)
        {
            return await MoveInstruction(request, Direction.Down);
        }

        private async Task<IActionResult> MoveInstruction(MoveInstructionRequest request, Direction direction)
        {
            try
            {
                var instruction = await _context.Instrucao
                    .FirstOrDefaultAsync(i => i.Id == request.Id);

                if (instruction == null)
                    return Json(new { success = false, message = "Instrução não encontrada" });

                // Determine target order based on direction
                var targetOrder = direction == Direction.Up
                    ? instruction.OrdemCronologica - 1
                    : instruction.OrdemCronologica + 1;

                // Find the instruction we're swapping with
                var swapWith = await _context.Instrucao
                    .FirstOrDefaultAsync(i =>
                        i.CenaId == instruction.CenaId &&
                        i.OrdemCronologica == targetOrder);

                if (swapWith == null)
                    return Json(new { success = false, message = "Movimento não permitido" });

                // Perform the swap
                instruction.OrdemCronologica = targetOrder;
                swapWith.OrdemCronologica = direction == Direction.Up
                    ? targetOrder + 1
                    : targetOrder - 1;

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    movedId = instruction.Id,
                    newOrder = instruction.OrdemCronologica,
                    swappedId = swapWith.Id,
                    swappedOrder = swapWith.OrdemCronologica
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Erro ao mover instrução",
                    detail = ex.Message
                });
            }
        }

        public class MoveInstructionRequest
        {
            public int Id { get; set; }
        }

        private enum Direction { Up, Down }

        #endregion MOVE 

        [HttpGet]
        public async Task<IActionResult> GetInstrucoesJson(int id)
        {
            var cena = await _context.Cena
                .Include(c => c.Instrucoes)
                .ThenInclude(i => i.InstrucoesPersonagens)
                .ThenInclude(ip => ip.Personagem)
                .FirstOrDefaultAsync(c => c.Id == id);

            var result = cena?.Instrucoes?
                .OrderBy(i => i.OrdemCronologica)
                .Select(i => new
                {
                    i.Id,
                    i.CenaId,
                    i.OrdemCronologica,
                    TipoDeInstrucao = i.TipoDeInstrucao.ToString(),
                    i.Texto,
                    InstrucoesPersonagens = i.InstrucoesPersonagens.Select(ip => new
                    {
                        ip.PersonagemId,
                        ip.ShowAll,
                        ip.ShowAllExcept,
                        PersonagemNome = ip.Personagem?.Nome
                    })
                }).ToList();

            return Json(result);
        }

    }
}

