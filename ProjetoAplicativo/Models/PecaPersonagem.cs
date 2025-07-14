// FILE: PecaPersonagem.cs
namespace ProjetoAplicativo.Models
{
    public class PecaPersonagem
    {
        public int Id { get; set; }
        public int PecaId { get; set; }
        public Peca? Peca { get; set; }
        public int PersonagemId { get; set; }
        public Personagem? Personagem { get; set; }
    }
}