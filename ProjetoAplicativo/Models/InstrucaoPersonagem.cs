// FILE: InstrucaoPersonagem.cs
namespace ProjetoAplicativo.Models
{
    public class InstrucaoPersonagem
    {
        public int Id { get; set; }
        public int InstrucaoId { get; set; }
        public Instrucao? Instrucao { get; set; }
        public int? PersonagemId { get; set; }
        public Personagem? Personagem { get; set; }
        public bool ShowAll { get; set; }
        public bool ShowAllExcept { get; set; }
        public Enums.EnumInstrucao.TipoDeParticipacao TipoDeParticipacao { get; set; }
    }
}