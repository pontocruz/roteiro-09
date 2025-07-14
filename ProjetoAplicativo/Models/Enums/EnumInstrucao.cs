// FILE: EnumInstrucao.cs
using System.ComponentModel.DataAnnotations;
namespace ProjetoAplicativo.Models.Enums
{
    public class EnumInstrucao
    {
        public enum TipoDeInstrucao { [Display(Name = "Fala")] Fala, [Display(Name = "Ação")] Acao, [Display(Name = "Nota")] Nota, }
        public enum TipoDeParticipacao { [Display(Name = "Executor")] Executor, [Display(Name = "Citado")] Citado, [Display(Name = "Exceto")] Exceto, [Display(Name = "Receptor")] Receptor, }
    }
}