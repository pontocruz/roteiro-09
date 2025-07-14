using System.ComponentModel.DataAnnotations;

namespace ProjetoAplicativo.Models.Palco
{
    public class _Deslocamento
    {
        public int Id { get; set; }
        public int[]? ArrayCoordenadas { get; set; }
        [DataType(DataType.MultilineText)] public string? Explicacao { get; set; }
    }
}
