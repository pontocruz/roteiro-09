// FILE: Gesto.cs
using System.ComponentModel.DataAnnotations;
namespace ProjetoAplicativo.Models
{
    public class Gesto
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        [DataType(DataType.MultilineText)] public string? Explicacao { get; set; }
    }
}