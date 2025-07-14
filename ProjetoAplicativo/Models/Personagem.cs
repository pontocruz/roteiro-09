// FILE: Personagem.cs
namespace ProjetoAplicativo.Models
{
    public class Personagem
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public List<InstrucaoPersonagem>? InstrucoesPersonagens { get; set; }
        public List<PecaPersonagem>? PecasPersonagens { get; set; }
    }
}