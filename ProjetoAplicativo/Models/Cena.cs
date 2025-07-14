// FILE: Cena.cs
namespace ProjetoAplicativo.Models
{
    public class Cena
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public int PecaId { get; set; }
        public Peca? Peca { get; set; }
        public List<Instrucao>? Instrucoes { get; set; }
    }
}