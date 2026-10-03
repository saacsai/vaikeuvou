// Monta o texto de "ideias centrais" da pauta automática do #VamoAí?, a
// partir dos dados do próprio evento — sem IA nenhuma envolvida aqui, só
// composição de texto. Vira o insumo que o processamento (Claude Code) lê
// depois pra escrever o post de verdade.
export function composeVamoAiBrief(evento: {
  event_date: string
  location: string | null
  description: string | null
  cidade: string | null
  valor: number | null
  slug: string
  organizador_nome?: string | null
  organizador_descricao?: string | null
  organizador_endereco?: string | null
  organizador_contato?: string | null
  organizador_horario?: string | null
  organizador_link?: string | null
}): string {
  const partes: string[] = []

  const data = new Date(evento.event_date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  partes.push(`Data: ${data}`)

  if (evento.cidade) partes.push(`Cidade: ${evento.cidade}`)
  if (evento.location) partes.push(`Local: ${evento.location}`)
  if (evento.valor) partes.push(`Valor: R$ ${evento.valor}`)
  if (evento.description) partes.push(`Descrição do organizador: ${evento.description}`)

  // Seção "Quem está organizando?" do post #VamoAí? depende disso — sem
  // esse dado o post fica sem crédito de quem organiza (ver PERFIL_CRIADOR.md).
  if (evento.organizador_nome) {
    partes.push(`Organizador: ${evento.organizador_nome}`)
    if (evento.organizador_descricao) partes.push(`Sobre o organizador: ${evento.organizador_descricao}`)
    if (evento.organizador_endereco) partes.push(`Endereço/base do organizador: ${evento.organizador_endereco}`)
    if (evento.organizador_contato) partes.push(`Contato do organizador: ${evento.organizador_contato}`)
    if (evento.organizador_horario) partes.push(`Horário de funcionamento: ${evento.organizador_horario}`)
    if (evento.organizador_link) partes.push(`Site do organizador: ${evento.organizador_link}`)
  }

  partes.push(`Link do evento: https://live.vaikeuvou.app/e/${evento.slug}`)

  return partes.join('\n')
}
