'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIPOS = [
  { value: 'VaikeuFui',   label: '#VaikeuFui',   desc: 'Resenha em primeira pessoa — só lugar onde foi e gostou' },
  { value: 'Tendeu',      label: '#Tendeu',      desc: 'Tutorial — responde uma dúvida específica' },
  { value: 'ProntoFalei', label: '#ProntoFalei', desc: 'Opinião — constrói a tese "quem vai importa mais que onde"' },
  { value: 'SouFa',       label: '#SouFã',       desc: 'Post-âncora de um destino — visão geral da cidade, 1 por categoria' },
  { value: 'Revisar',     label: 'Revisar',      desc: 'Post já publicado que precisa de ajuste' },
]

export default function PautaForm() {
  const router = useRouter()
  const [tipo,           setTipo]           = useState<'VaikeuFui' | 'Tendeu' | 'ProntoFalei' | 'SouFa' | 'Revisar'>('VaikeuFui')
  const revisar = tipo === 'Revisar'
  const souFa = tipo === 'SouFa'
  const [titulo,         setTitulo]         = useState('')
  const [ideiasCentrais, setIdeiasCentrais] = useState('')
  const [imagem,         setImagem]         = useState<File | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [erro,           setErro]           = useState('')
  const [ok,             setOk]             = useState(false)

  const MIN_W = 1280
  const MIN_H = 768

  function escolherImagem(file: File | null) {
    setErro('')
    if (!file) { setImagem(null); return }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (img.naturalWidth < MIN_W || img.naturalHeight < MIN_H) {
        setErro(`Imagem muito pequena (${img.naturalWidth}x${img.naturalHeight}) — mínimo ${MIN_W}x${MIN_H}.`)
        setImagem(null)
        return
      }
      setImagem(file)
    }
    img.src = url
  }

  async function salvar() {
    if (!titulo.trim() || !ideiasCentrais.trim()) {
      setErro('Preencha título e ideias centrais.')
      return
    }
    setSaving(true)
    setErro('')
    setOk(false)

    const body = new FormData()
    body.set('tipo', tipo)
    body.set('titulo', titulo)
    body.set('ideias_centrais', ideiasCentrais)
    if (imagem) body.set('imagem', imagem)

    const res = await fetch('/api/admin/pautas', { method: 'POST', body })
    const json = await res.json()

    if (!res.ok) { setErro(json.error ?? 'Erro ao salvar.'); setSaving(false); return }

    setTitulo('')
    setIdeiasCentrais('')
    setImagem(null)
    setOk(true)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <p className="text-sm font-bold text-gray-900">Nova pauta</p>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tipo</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value as typeof tipo)}
              className={`rounded-xl p-3 text-left border transition-colors ${
                tipo === t.value ? 'border-brand bg-brand/5' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-xs font-bold text-gray-900">{t.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          {revisar ? 'Título exato do post no WordPress' : souFa ? 'Destino (cidade)' : 'Título'}
        </label>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder={revisar ? 'Cole o título exatamente como está publicado' : souFa ? 'Ex: Bertioga' : 'Ex: Trilha da Pedra Grande em Atibaia'}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm"
        />
        {revisar && (
          <p className="text-[10px] text-gray-400 mt-1">Tem que bater exatamente com o título do post — é assim que ele é localizado.</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          {revisar ? 'O que revisar' : souFa ? 'Sobre o destino' : 'Ideias centrais'}
        </label>
        <textarea
          value={ideiasCentrais}
          onChange={e => setIdeiasCentrais(e.target.value)}
          placeholder={revisar
            ? 'O que precisa mudar nesse post — ajuste de fato, tom, trecho a cortar/acrescentar etc. O texto original é lido antes de reformular.'
            : souFa
            ? 'Visão geral da cidade: o que tem, como chegar, dica prática. É o post-âncora do destino — as experiências específicas ficam pros #VaikeuFui.'
            : 'O cerne do que você viveu/pensa — o que só você sabe e a IA não pode inventar. Pode ser bagunçado, tópicos soltos, sem formatação.'}
          rows={5}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-brand text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Imagem destacada (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={e => escolherImagem(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand/10 file:text-brand file:font-bold file:text-xs file:uppercase"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Mínimo {MIN_W}x{MIN_H}px. Se não enviar, a imagem é gerada por IA depois — manda a sua
          se já tiver uma foto melhor, assim quem for publicar não precisa correr atrás dela.
        </p>
        {imagem && <p className="text-[10px] text-green-600 mt-1">✓ {imagem.name} selecionada.</p>}
      </div>

      {erro && <p className="text-xs text-red-500">{erro}</p>}
      {ok && <p className="text-xs text-green-600">Pauta salva — entra na fila como pendente.</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide"
      >
        {saving ? 'Salvando…' : 'Adicionar à fila'}
      </button>
    </div>
  )
}
