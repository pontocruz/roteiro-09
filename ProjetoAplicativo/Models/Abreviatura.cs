// FILE: Abreviatura
namespace ProjetoAplicativo.Models
{
    public class Abreviatura
    {
        public int Id { get; set; }
        public int? EntidadeId { get; set; }
        public string? NomeAbreviado { get; set; }
        public Enums.EnumUtils.Discriminador Discriminador { get; set; }
    }
}