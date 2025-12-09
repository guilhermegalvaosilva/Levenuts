# Levenuts

Levenuts — site de vendas de chocolates artesanais (front-end simples).

## Descrição

Página estática com catálogo de produtos, carrinho de compras (sidebar) e fluxo de checkout simulado. Carrinho usa `localStorage`. Checkout envia pedido para um endpoint de teste (https://httpbin.org/post) e limpa o carrinho ao confirmar.

## Principais funcionalidades

- Layout responsivo (HTML + CSS)
- Lista de produtos com botão "Adicionar"
- Carrinho em sidebar (abrir/fechar, aumentar/diminuir quantidade, remover)
- Persistência do carrinho em localStorage
- Página de checkout com formulário, validação básica, máscara de cartão e envio simulado
- Mensagens de sucesso/erro e feedback visual (spinner)

## Estrutura do projeto

- index.html — página principal (catálogo + carrinho)
- style.css — estilos principais
- script.js — lógica do carrinho (adicionar, renderizar, persistir)
- checkout.html — página de finalização do pedido
- checkout.css — estilos do checkout
- checkout.js — lógica do checkout (resumo do pedido, envio simulado)
- img/ — imagens usadas
- README.md — este arquivo

## Executar localmente (Windows)

Recomenda-se usar um servidor estático para evitar restrições de fetch / CORS:

Usando Python (se instalado):

1. Abra PowerShell no diretório do projeto:
   cd c:\Users\guiga\Levenuts-1
2. Rode:
   python -m http.server 8000
3. Abra no navegador:
   http://localhost:8000

Ou usar um servidor via Node (serve):

1. npm install -g serve
2. serve .

Também é possível abrir `index.html` diretamente, mas algumas funcionalidades (fetch no checkout) podem falhar sem servidor.

## Notas de desenvolvimento

- Produtos estão embutidos no markup com atributos data-\* (id/name/price/img). Para gerenciar dinamicamente, mova os dados para `products.json` e renderize via JavaScript.
- O checkout atualmente envia dados para https://httpbin.org/post — substituir pelo endpoint real da sua API/gateway de pagamento.
- Ajuste estilos em `style.css` / `checkout.css` conforme identidade visual.

## Contribuição

Melhorias bem-vindas:

- Integração com gateway de pagamentos real
- Validações mais robustas e segurança (não salvar dados sensíveis no localStorage)
- Internacionalização e acessibilidade adicionais

## Licença

Uso livre para desenvolvimento interno. Adicionar licença adequada conforme necessário.

## Contato

Projeto mantido localmente. Para dúvidas e alterações, editar arquivos na pasta do repositório.
