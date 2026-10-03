'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Event, Rsvp } from '@/lib/supabase'
import DatePicker from '@/components/DatePicker'
import TimePicker from '@/components/TimePicker'
import { ProfilePopover, GridIcon } from '@/components/AppHeaderNav'
import AppFooter from '@/components/AppFooter'
import EventPreviewCard from '@/components/EventPreviewCard'
import BgSelector from '@/components/BgSelector'
import MiniEditor from '@/components/MiniEditor'
import { fmtDate, fmtDateRange } from '@/lib/slug'
import { DURACAO_OPCOES, type EventFormFields } from '@/lib/eventForm'

const PRIVACIDADE = [
  { value: 1,   label: 'Privado',          desc: 'Só você convida' },
  { value: 2,   label: 'Amigos de amigos', desc: 'Quem confirmar pode convidar' },
  { value: 999, label: 'Aberto',           desc: 'Viralização ilimitada' },
]

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

type Props = {
  evento: Event
  rsvps: Rsvp[]
  isNovo: boolean
  userName: string | null
  userAvatar: string | null
  userBio: string | null
  userInstagram: string | null
  userMpConectado: boolean
  comissaoPercentual: number
  podeCriarPost?: boolean
}

function parseEventDate(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { date: '', time: '' }

  // Supabase devolve o timestamp em UTC — precisa converter pro fuso de
  // exibição (America/Sao_Paulo) antes de extrair data/hora, senão o
  // horário salvo em -03:00 vem deslocado (ex: 21:00 vira 00:00 do dia
  // seguinte se lido cru da string).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

function toForm(evento: Event): EventFormFields {
  const { date, time } = parseEventDate(evento.event_date)
  return {
    title: evento.title,
    event_date: date,
    event_date_fim: evento.event_date_fim ?? '',
    event_time: time,
    duration_minutes: evento.duration_minutes ?? '',
    location: evento.location ?? '',
    description: evento.description ?? '',
    max_depth: evento.max_depth,
    external_url: evento.external_url ?? '',
    external_url_label: evento.external_url_label ?? '',
    video_url: evento.video_url ?? '',
    bg_image_url: evento.bg_image_url ?? '',
    cidade: evento.cidade ?? '',
    valor: evento.valor ?? '',
    descricao_pacote: evento.descricao_pacote ?? '',
    programacao: evento.programacao ?? '',
    max_parcelas: evento.max_parcelas,
    divulgar_blog: evento.divulgar_blog,
    vagas_minimas: evento.vagas_minimas ?? '',
    vagas_maximas: evento.vagas_maximas ?? '',
    data_viabilizacao: evento.data_viabilizacao ?? '',
    organizador_nome: evento.organizador_nome ?? '',
    organizador_descricao: evento.organizador_descricao ?? '',
    organizador_endereco: evento.organizador_endereco ?? '',
    organizador_contato: evento.organizador_contato ?? '',
    organizador_horario: evento.organizador_horario ?? '',
    organizador_link: evento.organizador_link ?? '',
  }
}

export default function DashboardClient({ evento, rsvps, isNovo, userName, userAvatar, userBio, userInstagram, userMpConectado, comissaoPercentual, podeCriarPost }: Props) {
  const router = useRouter()
  const [initial,   setInitial]   = useState<EventFormFields>(() => toForm(evento))
  const [form,      setForm]      = useState<EventFormFields>(() => toForm(evento))
  const [multiDia,  setMultiDia]  = useState(() => !!evento.event_date_fim)
  const [copiado,   setCopiado]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')
  const [editando,  setEditando]  = useState(false)
  const [salvandoViab, setSalvandoViab] = useState(false)
  const [erroViab,      setErroViab]      = useState('')

  function onHeaderImageUploaded(url: string) {
    setForm(p => ({ ...p, bg_image_url: url }))
    setInitial(p => ({ ...p, bg_image_url: url }))
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  function set(k: keyof EventFormFields, v: string | number | boolean) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const linkConvite = `https://live.vaikeuvou.app/e/${evento.slug}`
  const refFimEvento = evento.event_date_fim ? `${evento.event_date_fim}T23:59:59-03:00` : evento.event_date
  const isPast = new Date(refFimEvento).getTime() < Date.now()

  const nivel1 = rsvps.filter(r => r.depth_level === 1)
  const nivel2 = rsvps.filter(r => r.depth_level === 2)
  const nivel3 = rsvps.filter(r => r.depth_level >= 3)

  const isPago = !!evento.valor && evento.valor > 0
  const pagos = rsvps.filter(r => r.pago)
  const vendido = pagos.reduce((sum, r) => sum + (r.valor_pago ?? 0), 0)
  const comissao = vendido * (comissaoPercentual / 100)
  const liquido = vendido - comissao

  function copiar(txt: string) {
    navigator.clipboard.writeText(txt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function decidirViabilizacao(acao: 'confirmar' | 'cancelar') {
    setSalvandoViab(true)
    setErroViab('')
    const res = await fetch('/api/eventos/viabilizacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_token: evento.edit_token, acao }),
    })
    const json = await res.json()
    if (!res.ok) { setErroViab(json.error ?? 'Erro ao salvar.'); setSalvandoViab(false); return }
    router.refresh()
  }

  async function salvar() {
    if (!form.title || !form.event_date || (multiDia ? !form.event_date_fim : !form.event_time)) {
      setMsg(multiDia ? 'Preencha pelo menos o título, a data de início e a data de término.' : 'Preencha pelo menos o título, a data e o horário.')
      return
    }
    if (multiDia && form.event_date_fim < form.event_date) {
      setMsg('A data de término precisa ser igual ou depois da data de início.')
      return
    }
    setSaving(true)
    setMsg('')

    const event_date = `${form.event_date}T${multiDia ? '00:00' : form.event_time}:00-03:00`

    const res = await fetch('/api/eventos/editar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edit_token: evento.edit_token, ...form, event_date,
        event_date_fim: multiDia ? form.event_date_fim : '',
      }),
    })
    const json = await res.json()

    if (!res.ok) { setMsg(json.error ?? 'Erro ao salvar.'); setSaving(false); return }

    setInitial(form)
    setMsg('Salvo!')
    setSaving(false)
  }

  const whatsappTxt = `Você está convidado para "${form.title}"! Confirme sua presença: ${linkConvite}`

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">

        {/* Header — padrão */}
        <div className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1 mb-8">
          <div className="flex items-center justify-between md:contents">
            <a href="https://vaikeuvou.app" className="flex-shrink-0">
              <Image src="/logo.png" alt="vaikeuvou" width={1230} height={315} className="h-[43px] md:h-[47px] w-auto -mt-[25px]" />
            </a>
            <div className="flex items-center gap-1 md:hidden">
              <ProfilePopover userName={userName} userAvatar={userAvatar} podeCriarPost={podeCriarPost} />
            </div>
          </div>

          <div className="flex items-center gap-x-2 flex-wrap md:flex-1 min-w-0">
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <a href="/meus-convites" className="text-gray-400 hover:text-gray-600 text-sm whitespace-nowrap">Meus eventos</a>
            <span className="text-gray-300 text-sm whitespace-nowrap">»</span>
            <span className="text-brand font-bold text-[25px] truncate">{evento.title}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <ProfilePopover userName={userName} userAvatar={userAvatar} podeCriarPost={podeCriarPost} />
          </div>
        </div>

        {isNovo && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 font-bold text-sm">🎉 Evento criado com sucesso!</p>
          </div>
        )}

        {/* Status rápido — contadores + compartilhar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center">
              <p className="text-2xl font-extrabold text-brand">{rsvps.length}</p>
              <p className="text-gray-500 text-xs mt-1">Total</p>
              {rsvps.length > 0 && (
                <a href={`/dashboard/${evento.edit_token}/convidados`} className="text-[10px] font-semibold text-brand mt-1">
                  Ver quem vai
                </a>
              )}
            </div>
            {[
              { label: 'Nível 1',  count: nivel1.length },
              { label: 'Nível 2+', count: nivel2.length + nivel3.length },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm flex flex-col justify-center">
                <p className="text-2xl font-extrabold text-brand">{c.count}</p>
                <p className="text-gray-500 text-xs mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
            {isPast ? (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Evento encerrado</p>
                <p className="text-gray-500 text-sm">Esse evento já aconteceu em {evento.event_date_fim ? fmtDateRange(evento.event_date, evento.event_date_fim) : fmtDate(evento.event_date)} — não é mais possível compartilhar ou editar.</p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Link do evento</p>
                <div className="flex gap-2">
                  <input
                    readOnly value={linkConvite}
                    className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono outline-none"
                  />
                  <button
                    onClick={() => copiar(linkConvite)}
                    className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wide"
                  >
                    {copiado ? '✓' : 'Copiar'}
                  </button>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappTxt)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366] text-white font-bold text-sm"
                >
                  Compartilhar no WhatsApp
                </a>
                <button
                  onClick={() => copiar(`<iframe src="https://live.vaikeuvou.app/embed/${evento.slug}" width="320" height="70" frameborder="0"></iframe>`)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
                >
                  {copiado ? '✓ Código copiado' : 'Copiar código de incorporação'}
                </button>
                <p className="text-[10px] text-gray-400 text-center">Cole no seu site/blog — abre este evento quando alguém clicar.</p>
              </>
            )}
          </div>
        </div>

        {isPago && !userMpConectado && (
          <div className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="text-amber-800 font-bold text-sm">Conecte sua conta Mercado Pago</p>
              <p className="text-amber-700 text-xs mt-0.5">Sem isso, ninguém consegue pagar esse evento — o valor cai direto na sua conta, menos a comissão vaikeuvou.</p>
            </div>
            <a
              href="/api/mp/conectar"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wide whitespace-nowrap text-center"
            >
              Conectar Mercado Pago
            </a>
          </div>
        )}

        {/* Quórum — só aparece quando o evento tem vagas mín/máx definidas
            (não tem em evento com checkout externo). */}
        {!!evento.vagas_minimas && !!evento.vagas_maximas && (
          <div className="mb-10 bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quórum do evento</p>
              {evento.cancelado_em && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 uppercase">Cancelado</span>
              )}
              {evento.viabilizacao_confirmada_em && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 uppercase">Confirmado</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${Math.min(100, (rsvps.length / evento.vagas_minimas) * 100)}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                {rsvps.length} de {evento.vagas_minimas} mín. ({evento.vagas_maximas} máx.)
              </p>
            </div>

            {!evento.cancelado_em && !evento.viabilizacao_confirmada_em && (
              <>
                <p className="text-[10px] text-gray-400">
                  Prazo pra decidir: {fmtDate(evento.data_viabilizacao!)}
                  {rsvps.length >= evento.vagas_minimas
                    ? ' — mínimo atingido, já pode confirmar antes do prazo.'
                    : ' — libera o botão de confirmar assim que atingir o mínimo, ou quando chegar o prazo.'}
                </p>
                {erroViab && <p className="text-xs text-red-500">{erroViab}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => decidirViabilizacao('confirmar')}
                    disabled={salvandoViab || (rsvps.length < evento.vagas_minimas && new Date(evento.data_viabilizacao!) > new Date())}
                    className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wide"
                  >
                    Confirmar realização
                  </button>
                  <button
                    onClick={() => decidirViabilizacao('cancelar')}
                    disabled={salvandoViab}
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 text-xs font-bold uppercase tracking-wide"
                  >
                    Cancelar evento
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Painel financeiro — só aparece em eventos pagos */}
        {isPago && (
          <div className="mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Financeiro</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-brand">{fmtBRL(vendido)}</p>
                <p className="text-gray-500 text-xs mt-1">Total vendido</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-brand">{pagos.length}</p>
                <p className="text-gray-500 text-xs mt-1">Pagos de {rsvps.length}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-green-600">{fmtBRL(liquido)}</p>
                <p className="text-gray-500 text-xs mt-1">Líquido pra você</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Repasse combinado direto com o Luciano/Sandro — pagamento sai automático via cartão, o líquido é acertado à parte por enquanto.</p>
          </div>
        )}

        {/* Edição completa — mesma estrutura do /criar (eventos futuros); eventos
            passados mostram só o preview mascarado, sem editar nem compartilhar */}
        {isPast ? (
          <div className="mb-12 max-w-sm">
            <div className="relative">
              <EventPreviewCard form={initial} userName={userName} userAvatar={userAvatar} userBio={userBio} userInstagram={userInstagram} />
              <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] rounded-lg flex items-center justify-center p-6">
                <p className="text-center text-gray-600 font-bold text-sm">Esse evento já aconteceu.</p>
              </div>
            </div>
          </div>
        ) : !editando ? (
          <div className="mb-12">
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 hover:border-brand hover:bg-brand/5 text-gray-700 font-semibold text-sm uppercase tracking-wide transition-colors"
            >
              Editar evento
              <EditIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Editar evento</p>
              <button onClick={() => setEditando(false)} className="text-xs font-bold text-brand hover:text-brand-dark uppercase tracking-wide">
                Fechar ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome do evento *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Churrasco de Sábado"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{multiDia ? 'Data de início *' : 'Data *'}</label>
                <DatePicker value={form.event_date} onChange={v => set('event_date', v)} />
              </div>
              {multiDia ? (
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data de término *</label>
                  <DatePicker value={form.event_date_fim} onChange={v => set('event_date_fim', v)} />
                </div>
              ) : (
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Horário *</label>
                  <TimePicker value={form.event_time} onChange={v => set('event_time', v)} />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2">
              <input
                type="checkbox"
                checked={multiDia}
                onChange={e => {
                  const v = e.target.checked
                  setMultiDia(v)
                  if (!v) set('event_date_fim', '')
                }}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              Evento com mais de um dia (pacote/viagem)
            </label>

            {!multiDia && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Duração</label>
                <select
                  value={form.duration_minutes}
                  onChange={e => set('duration_minutes', e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-brand text-sm"
                >
                  <option value="">Não informar</option>
                  {DURACAO_OPCOES.map((o, i) => (
                    <option key={i} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Local</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Endereço ou nome do lugar"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Cidade (opcional)</label>
              <input
                value={form.cidade}
                onChange={e => set('cidade', e.target.value)}
                placeholder="Só pra eventos ligados a um QG/destino turístico"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Valor por pessoa (opcional)</label>
              <input
                value={form.valor}
                onChange={e => set('valor', e.target.value ? Number(e.target.value) : '')}
                placeholder="Deixe em branco pra evento grátis"
                type="number" min={0} step="0.01"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Com valor definido, confirmar presença (BORA) exige pagamento.</p>
            </div>

            {!!form.valor && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Parcelamento em até</label>
                  <input
                    value={form.max_parcelas}
                    onChange={e => set('max_parcelas', Number(e.target.value))}
                    type="number" min={1} max={12} step="1"
                    className="w-32 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-brand text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Padrão 3x — usado no destaque de preço no evento.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">O que está incluso (opcional)</label>
                  <MiniEditor
                    value={form.descricao_pacote}
                    onChange={v => set('descricao_pacote', v)}
                    placeholder="Ex: churrasco completo + bebida, ida e volta de barco, welcome drink..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Programação detalhada (opcional)</label>
                  <MiniEditor
                    value={form.programacao}
                    onChange={v => set('programacao', v)}
                    placeholder="Ex: 9h chegada, 10h saída do barco, 13h almoço, 17h volta..."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Link externo</label>
              <input
                value={form.external_url}
                onChange={e => set('external_url', e.target.value)}
                placeholder="https://...(ingresso, mais informações, etc...)"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
            </div>

            {form.external_url && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Texto do botão</label>
                <input
                  value={form.external_url_label}
                  onChange={e => set('external_url_label', e.target.value)}
                  placeholder="Ex: Comprar ingresso 🎟️"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                />
              </div>
            )}

            {!form.external_url && (
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700">Quórum do evento *</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Vagas mínimas</label>
                    <input
                      value={form.vagas_minimas}
                      onChange={e => set('vagas_minimas', e.target.value ? Number(e.target.value) : '')}
                      type="number" min={1} step="1"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Vagas máximas</label>
                    <input
                      value={form.vagas_maximas}
                      onChange={e => set('vagas_maximas', e.target.value ? Number(e.target.value) : '')}
                      type="number" min={1} step="1"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Data limite pra decidir se o evento vai acontecer</label>
                  <DatePicker value={form.data_viabilizacao} onChange={v => set('data_viabilizacao', v)} />
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Foto, nome, bio e @Instagram da sua assinatura se editam direto no
                seu perfil. Acesse: <GridIcon className="inline-block w-3.5 h-3.5 align-[-2px] mx-0.5" /> menu » Editar perfil.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Comentários</label>
              <MiniEditor
                value={form.description}
                onChange={v => set('description', v)}
                placeholder="Personalize a mensagem com um convite especial para quem está recebendo."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quem pode convidar?</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIVACIDADE.map(p => (
                  <button
                    key={p.value}
                    onClick={() => set('max_depth', p.value)}
                    className={`rounded-xl p-3 text-left border transition-colors ${
                      form.max_depth === p.value
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900">{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
              {form.max_depth === 999 && (
                <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.divulgar_blog}
                    onChange={e => set('divulgar_blog', e.target.checked)}
                    className="mt-0.5 w-4 h-4 flex-shrink-0 accent-brand"
                  />
                  <span className="text-xs text-gray-600">
                    <strong className="text-gray-900">Autorizo divulgar esse evento no blog vaikeuvou.</strong>
                    {' '}Vira matéria no blog (tag #VamoAí?) — a equipe vaikeuvou revisa antes de publicar.
                  </span>
                </label>
              )}
              {form.max_depth === 999 && form.divulgar_blog && (
                <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-700">Quem está organizando? *</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nome do organizador/empresa</label>
                    <input
                      value={form.organizador_nome}
                      onChange={e => set('organizador_nome', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sobre o organizador</label>
                    <textarea
                      value={form.organizador_descricao}
                      onChange={e => set('organizador_descricao', e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Endereço/base</label>
                      <input
                        value={form.organizador_endereco}
                        onChange={e => set('organizador_endereco', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contato/WhatsApp</label>
                      <input
                        value={form.organizador_contato}
                        onChange={e => set('organizador_contato', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Horário de funcionamento</label>
                      <input
                        value={form.organizador_horario}
                        onChange={e => set('organizador_horario', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Site</label>
                      <input
                        value={form.organizador_link}
                        onChange={e => set('organizador_link', e.target.value)}
                        type="url"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:hidden">
              <BgSelector
                value={form.bg_image_url}
                onChange={v => set('bg_image_url', v)}
                title={form.title}
                editToken={evento.edit_token}
                hasAvatar={!!userAvatar}
                onUploaded={onHeaderImageUploaded}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Vídeo do evento</label>
              <input
                value={form.video_url}
                onChange={e => set('video_url', e.target.value)}
                placeholder="Cole o link do vídeo do YouTube/Vimeo"
                type="url"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">Aparece abaixo do botão BORA na página do evento</p>
            </div>

            {msg && (
              <p className={`text-sm ${msg === 'Salvo!' ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
            )}

            <button
              onClick={salvar}
              disabled={saving || !dirty}
              className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-colors ${
                dirty
                  ? 'bg-brand hover:bg-brand-dark text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {saving ? 'Salvando…' : dirty ? 'Salvar alterações' : 'Nada para salvar'}
            </button>
          </div>

          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 text-center">Preview</p>
            <div className="sticky top-6 space-y-3">
              <EventPreviewCard form={form} userName={userName} userAvatar={userAvatar} userBio={userBio} userInstagram={userInstagram} />
              <BgSelector
                value={form.bg_image_url}
                onChange={v => set('bg_image_url', v)}
                title={form.title}
                editToken={evento.edit_token}
                hasAvatar={!!userAvatar}
                onUploaded={onHeaderImageUploaded}
              />
            </div>
          </div>

        </div>
        )}

        {/* Confirmados */}
        {rsvps.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Confirmados</p>
                {isPast && (
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-green-600 leading-none">
                      {rsvps.filter(r => r.checked_in_at).length}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">de {rsvps.length} foram</span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(isPast
                  ? [...rsvps].sort((a, b) => (b.checked_in_at ? 1 : 0) - (a.checked_in_at ? 1 : 0))
                  : rsvps
                ).map(r => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
                      isPast && r.checked_in_at ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {r.user_name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.user_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isPast && r.checked_in_at && (
                        <span
                          title={r.checkin_verified ? 'Presença verificada por localização' : 'Confirmou que foi'}
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            r.checkin_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {r.checkin_verified ? '✓✓ foi' : '✓ foi'}
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.depth_level === 1 ? 'bg-blue-50 text-blue-600' :
                        r.depth_level === 2 ? 'bg-pink-50 text-pink-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        Nível {r.depth_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}

      </div>

      <AppFooter />
    </div>
  )
}
