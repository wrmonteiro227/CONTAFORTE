# Sexta-Feira

Assistente local com voz, memoria e busca publica.

## Primeira configuracao

1. Abra `supabase.sql` no SQL Editor do Supabase e execute o arquivo inteiro.
2. Preencha `js/config.js` com a URL e a chave anon/public do seu projeto.
3. Mantenha `sincronizarSupabase: false` ate configurarmos login. O IndexedDB local ja funciona sem conta.
4. Publique na Vercel normalmente.

Para testar a sincronizacao, habilite o provedor de login anonimo em Authentication > Providers > Anonymous no Supabase e altere a configuracao para `true`. A sincronizacao envia uma copia dos dados locais; a memoria local continua sendo a fonte principal durante esta fase.

Nunca use a chave `service_role` no frontend. Ela da acesso administrativo ao banco.