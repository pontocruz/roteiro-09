// FILE: Cenario.cs
namespace ProjetoAplicativo.Models.Palco
{
    public class Cenario
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public List<Zona>? Zonas { get; set; }
        public List<Peca>? Pecas { get; set; }
    }
}