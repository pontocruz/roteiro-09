// FILE: Descricao.cs
namespace ProjetoAplicativo.Models.Secundario
{
    public class Descricao
    {
        public int Id { get; set; }
        public int? EntidadeId { get; set; }
        public string? TextoDescricao { get; set; }
        public Enums.EnumUtils.Discriminador Discriminador { get; set; }
    }
}