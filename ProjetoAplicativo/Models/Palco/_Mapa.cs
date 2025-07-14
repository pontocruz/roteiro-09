namespace ProjetoAplicativo.Models.Palco
{
    public class _Mapa
    {
        public int Id { get; set; }
        public int CenarioId { get; set; }
        public Cenario? Cenario { get; set; }
        public string? GuidArquivo { get; set; }
    }
}
