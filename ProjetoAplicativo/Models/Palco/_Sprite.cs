namespace ProjetoAplicativo.Models.Palco
{
    public class _Sprite
    {
        public int Id { get; set; }
        public int? EntidadeId { get; set; }
        public string? TextoDescricao { get; set; }
        public string? GuidArquivo { get; set; }
        public Enums.EnumUtils.Discriminador Discriminador { get; set; }
    }
}
