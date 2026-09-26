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
  partes.push(`Link do evento: https://live.vaikeuvou.app/e/${evento.slug}`)

  return partes.join('\n')
}
