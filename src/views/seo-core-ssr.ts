/**
 * Server-Side Rendered SEO core page.
 * Returns full HTML with data pre-rendered for SEO and fast first paint.
 */

type SeoCoreRow = {
  id: string
  text: string
  freq: number | null
  freq_bucket: string | null
  city: string | null
  cluster_city: string | null
  priority_score: number
  cluster_name: string | null
  cluster_intent: string | null
  user_stage: string | null
  category_level: string | null
  page_path: string | null
  page_title: string | null
  notes: string | null
}

type PageItem = { id: string; path: string }
type ClusterItem = { id: string; name: string }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function orDash(val: string | number | null | undefined): string {
  if (val == null || val === '') return '—'
  return String(val)
}

export function renderSeoCorePage(params: {
  rows: SeoCoreRow[]
  total: number
  page: number
  limit: number
  pages: PageItem[]
  clusters: ClusterItem[]
  filters: {
    path: string
    clusterId: string
    city: string
    intent: string
    freqBucket: string
    search: string
  }
  baseUrl: string
  apiBase: string
}): string {
  const { rows, total, page, limit, pages, clusters, filters, baseUrl, apiBase } = params
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = total === 0 ? 0 : Math.min(page * limit, total)

  const q = (key: string, val: string) => (val ? `&${key}=${encodeURIComponent(val)}` : '')
  const paginationUrl = (p: number) =>
    `${baseUrl}?page=${p}${q('path', filters.path)}${q('clusterId', filters.clusterId)}${q('city', filters.city)}${q('intent', filters.intent)}${q('freqBucket', filters.freqBucket)}${q('search', filters.search)}`

  const rowsHtml = rows
    .map(
      (r) => `
    <tr class="sheet-row">
      <td title="${escapeHtml(r.text)}">${escapeHtml(r.text)}</td>
      <td class="text-stone-600 text-right" title="${orDash(r.freq)}">${orDash(r.freq)}</td>
      <td class="text-center">${r.freq_bucket ? `<span>${escapeHtml(r.freq_bucket)}</span>` : '—'}</td>
      <td class="text-stone-600" title="${escapeHtml(orDash(r.city || r.cluster_city))}">${escapeHtml(orDash(r.city || r.cluster_city))}</td>
      <td class="text-stone-600 text-right">${r.priority_score}</td>
      <td class="text-stone-600" title="${escapeHtml(orDash(r.cluster_name))}">${escapeHtml(orDash(r.cluster_name))}</td>
      <td class="text-stone-600" title="${escapeHtml(orDash(r.cluster_intent))}">${escapeHtml(orDash(r.cluster_intent))}</td>
      <td class="text-stone-600" title="${escapeHtml(orDash(r.user_stage))}">${escapeHtml(orDash(r.user_stage))}</td>
      <td class="text-stone-600" title="${escapeHtml(orDash(r.category_level))}">${escapeHtml(orDash(r.category_level))}</td>
      <td title="${escapeHtml(orDash(r.page_path))}">${escapeHtml(orDash(r.page_path))}</td>
      <td class="text-stone-600" title="${escapeHtml(orDash(r.page_title))}">${escapeHtml(orDash(r.page_title))}</td>
      <td class="text-stone-500" title="${escapeHtml(orDash(r.notes))}">${escapeHtml(orDash(r.notes))}</td>
    </tr>`
    )
    .join('')

  const emptyRow =
    rows.length === 0
      ? `<tr><td colspan="12" class="px-3 py-8 text-center text-stone-500">Нет записей по заданным фильтрам.</td></tr>`
      : ''

  const pagesOptions = pages.map((p) => `<option value="${escapeHtml(p.path)}"${filters.path === p.path ? ' selected' : ''}>${escapeHtml(p.path)}</option>`).join('')
  const clustersOptions = clusters.map((c) => `<option value="${escapeHtml(c.id)}"${filters.clusterId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')

  const paginationHtml =
    total > 0
      ? `
    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-stone-50 px-3 py-2">
      <span class="text-sm text-stone-600">Показано ${from}–${to} из ${total}</span>
      <div class="flex gap-1">
        <a href="${paginationUrl(Math.max(1, page - 1))}" class="rounded border border-stone-300 bg-white px-2 py-1 text-sm hover:bg-stone-100 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}">Назад</a>
        ${totalPages <= 10 ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => `<a href="${paginationUrl(p)}" class="rounded px-2 py-1 text-sm ${p === page ? 'bg-amber-500 text-white' : 'border border-stone-300 bg-white hover:bg-stone-100'}">${p}</a>`).join('') : `<span class="px-2 py-1 text-sm text-stone-500">${page} / ${totalPages}</span>`}
        <a href="${paginationUrl(Math.min(totalPages, page + 1))}" class="rounded border border-stone-300 bg-white px-2 py-1 text-sm hover:bg-stone-100 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}">Вперёд</a>
      </div>
    </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO ядро — Kodify</title>
  <meta name="description" content="SEO ядро: запросы, кластеры и привязка к страницам. Параметры семантического ядра проекта.">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif;
      font-size: 12px;
      background-color: #ffffff;
    }
    .font-display {
      font-family: 'IBM Plex Sans Condensed', system-ui, sans-serif;
    }
    /* Google Sheets–like dense table layout */
    .sheet-table {
      border-collapse: collapse;
      table-layout: fixed;
    }
    .sheet-table th,
    .sheet-table td {
      border: 1px solid #e5e5e5;
      padding: 4px 6px;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 11px;
    }
    .sheet-table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: #f3f4f6;
      font-weight: 600;
    }
    .sheet-row:nth-child(even) {
      background-color: #fafafa;
    }
    .sheet-row:hover {
      background-color: #f3f4ff;
    }
    .sheet-meta {
      font-size: 11px;
    }
  </style>
</head>
<body class="min-h-screen bg-stone-50 text-stone-900">
  <header class="border-b border-stone-200 bg-white px-4 py-4 shadow-sm md:px-6">
    <div class="mx-auto max-w-7xl">
      <h1 class="font-display text-2xl font-semibold text-stone-900 md:text-3xl">SEO ядро</h1>
      <p class="mt-1 text-sm text-stone-500">Запросы, кластеры и привязка к страницам. Все параметры семантического ядра. <strong>SSR</strong></p>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 py-6 md:px-6">
    <section class="mb-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Фильтры</h2>
      <form method="get" action="${baseUrl}" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <input type="hidden" name="page" value="1">
        <div>
          <label class="mb-1 block text-xs font-medium text-stone-600">Страница (path)</label>
          <select name="path" class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
            <option value="">Все</option>
            ${pagesOptions}
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-stone-600">Кластер</label>
          <select name="clusterId" class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
            <option value="">Все</option>
            ${clustersOptions}
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-stone-600">Город</label>
          <input type="text" name="city" value="${escapeHtml(filters.city)}" placeholder="Москва, СПб..." class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-stone-600">Интент</label>
          <input type="text" name="intent" value="${escapeHtml(filters.intent)}" placeholder="informational, commercial..." class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-stone-600">Частота (bucket)</label>
          <select name="freqBucket" class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
            <option value="">Любой</option>
            <option value="HF"${filters.freqBucket === 'HF' ? ' selected' : ''}>HF</option>
            <option value="MF"${filters.freqBucket === 'MF' ? ' selected' : ''}>MF</option>
            <option value="LF"${filters.freqBucket === 'LF' ? ' selected' : ''}>LF</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-stone-600">Поиск по запросу</label>
          <input type="text" name="search" value="${escapeHtml(filters.search)}" placeholder="Текст запроса..." class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
        <div class="xl:col-span-6 flex justify-end">
          <button type="submit" class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">Применить</button>
        </div>
      </form>
    </section>

    <section class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="sheet-table min-w-full text-left">
          <thead>
            <tr>
              <th style="width: 220px;">Запрос</th>
              <th style="width: 60px;">Частота</th>
              <th style="width: 60px;">Bucket</th>
              <th style="width: 90px;">Город</th>
              <th style="width: 70px;">Приоритет</th>
              <th style="width: 220px;">Кластер</th>
              <th style="width: 110px;">Интент</th>
              <th style="width: 90px;">Стадия</th>
              <th style="width: 90px;">Уровень</th>
              <th style="width: 160px;">Страница (path)</th>
              <th style="width: 260px;">Title страницы</th>
              <th style="width: 160px;">Заметки</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${emptyRow}
          </tbody>
        </table>
      </div>
      ${paginationHtml}
    </section>

    <p class="mt-4 text-center text-sm text-stone-500">
      <a href="${baseUrl}" class="text-amber-600 hover:underline">Обновить</a>
      · Документ отрендерен на сервере (SSR)
    </p>
  </main>
</body>
</html>`
}
