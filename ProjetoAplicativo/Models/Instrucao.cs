// FILE: Instrucao.cs
using System.ComponentModel.DataAnnotations;
namespace ProjetoAplicativo.Models
{
    public class Instrucao
    {
        public int Id { get; set; }
        public int CenaId { get; set; }
        public Cena? Cena { get; set; }
        public int OrdemCronologica { get; set; }
        public Enums.EnumInstrucao.TipoDeInstrucao TipoDeInstrucao { get; set; }
        public List<InstrucaoPersonagem>? InstrucoesPersonagens { get; set; }
        [DataType(DataType.MultilineText)] public string? Texto { get; set; }
    }
}