namespace ProjetoAplicativo.Models.Secundario
{
    public class IntertextualidadeEntidade
    {
        public int Id { get; set; }
        public int? EntidadeId { get; set; }
         public int? IntertextualidadeId { get; set; }
         public Intertextualidade? Intertextualidade { get; set; }
        public Enums.EnumUtils.Discriminador Discriminador { get; set; }
    }
}
