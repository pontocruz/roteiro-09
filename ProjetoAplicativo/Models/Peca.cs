// FILE: Peca.cs
namespace ProjetoAplicativo.Models
{
    public class Peca
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public List<Cena>? Cenas { get; set; }
        public List<PecaPersonagem>? PecasPersonagens { get; set; }
    }
}