export default function AppFooter() {
  return (
    <div className="pb-10 pt-6 px-5 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <a href="/historia">18 anos depois</a>
        <span>·</span>
        <a href="/termos">Termos de uso</a>
        <span>·</span>
        <a href="/privacidade">Política de Privacidade</a>
      </div>
      <p className="text-gray-300 text-xs">© 2026 vaikeuvou.app</p>
    </div>
  )
}
