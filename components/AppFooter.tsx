export default function AppFooter() {
  return (
    <div className="pb-10 pt-6 px-5 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <a href="https://vaikeuvou.app/termos-de-uso/" target="_blank" rel="noopener noreferrer">Termos de uso</a>
        <span>·</span>
        <a href="https://vaikeuvou.app/politica-de-privacidade/" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
      </div>
      <p className="text-gray-300 text-xs">© 2026 vaikeuvou.app</p>
    </div>
  )
}
