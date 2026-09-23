# Sexta-Feira

Assistente local com voz, memoria e busca publica.

## Primeira configuracao

1. Abra `supabase.sql` no SQL Editor do Supabase e execute o arquivo inteiro.
2. Preencha `js/config.js` com a URL e a chave anon/public do seu projeto.
3. Mantenha `sincronizarSupabase: false` ate configurarmos login. O IndexedDB local ja funciona sem conta.
4. Publique na Vercel normalmente.

Para testar a sincronizacao, habilite o provedor de login anonimo em Authentication > Providers > Anonymous no Supabase e altere a configuracao para `true`. A sincronizacao envia uma copia dos dados locais; a memoria local continua sendo a fonte principal durante esta fase.

Nunca use a chave `service_role` no frontend. Ela da acesso administrativo ao banco.

## God’s Eye View original

O comando `ativar olho de deus` abre o console original integrado em `gods-eye-view/`.
Ele nao e mais o globo decorativo da Sexta-Feira: o console usa CesiumJS e camadas
publicas de voos, satelites, terremotos, cameras e outras fontes de inteligencia
espacial.

Para iniciar o console em desenvolvimento:

```bash
cd gods-eye-view
npm install
GEV_ALLOW_EMBED=1 npm run dev -- --port 4174
```

Depois, mantenha a Sexta-Feira aberta e diga `ativar olho de deus`. Para encerrar,
diga `fechar o globo`. A URL pode ser alterada em `js/config.js` com
`godsEyeViewUrl` quando o console estiver hospedado em outro endereco.

O codigo do console e MIT. Dados, mapas, imagens e provedores de terceiros seguem
as licencas descritas em `gods-eye-view/LICENSE` e `gods-eye-view/DATA_SOURCES.md`.