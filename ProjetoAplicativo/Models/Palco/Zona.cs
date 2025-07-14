// FILE: Ponto.cs
namespace ProjetoAplicativo.Models.Palco
{
    public class Zona
    {
        public int Id { get; set; }
        public int CenarioId { get; set; }
        public Cenario? Cenario { get; set; }
        public string? Nome { get; set; }
    }
}