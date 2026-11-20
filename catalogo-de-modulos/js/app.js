document.addEventListener('DOMContentLoaded', () => {
  // Estado em memória (clonado de data.js para permitir CRUD na sessão)
  const state = {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    modules: JSON.parse(JSON.stringify(INITIAL_MODULES)),
    projects: JSON.parse(JSON.stringify(INITIAL_PROJECTS)),
    currentUser: null,
    selectedCategoryId: 1,
    selectedModuleId: 1,
    activeRepoModuleId: null,
    activeRepoFile: 'src/index.js',
    projectStatusFilter: 'all'
  };

  // =========================================================
  // UTILITÁRIOS GERAIS
  // =========================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
  }

  function getUserById(id) {
    return state.users.find(u => u.id === Number(id));
  }

  function getCategoryById(id) {
    return state.categories.find(c => c.id === Number(id));
  }

  function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s.includes('ativo')) return 'st-ativo';
    if (s.includes('aprovado')) return 'st-aprovado';
    if (s.includes('finalizado')) return 'st-finalizado';
    if (s.includes('andamento')) return 'st-andamento';
    if (s.includes('novo')) return 'st-novo';
    if (s.includes('avaliação') || s.includes('aprovação')) return 'st-avaliacao';
    return 'st-reprovado';
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Motor de sugestão por palavras-chave (conforme documentação do projeto)
  function suggestModulesByKeywords(keywordsArray) {
    const cleanKeys = keywordsArray
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    if (cleanKeys.length === 0) return [];

    return state.modules.filter(mod => {
      if (mod.status !== 'Ativo') return false;
      const cat = getCategoryById(mod.categoryId)?.name.toLowerCase() || '';
      const haystack = `${mod.name} ${mod.description} ${mod.technology} ${cat}`.toLowerCase();
      return cleanKeys.some(kw => haystack.includes(kw));
    });
  }

  // =========================================================
  // 1. AUTENTICAÇÃO: LOGIN, ERRO, SUCESSO E REDEFINIÇÃO
  // =========================================================
  const loginForm = document.getElementById('login-form');
  const loginFeedback = document.getElementById('login-feedback');

  // Atalhos rápidos na tela de login
  document.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('login-username').value = btn.dataset.user;
      document.getElementById('login-password').value = btn.dataset.pass;
      loginFeedback.classList.add('hidden');
    });
  });

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value;

    const foundUser = state.users.find(
      u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput
    );

    if (!foundUser) {
      loginFeedback.textContent = '❌ Usuário e/ou senha incorretos. Verifique suas credenciais e tente novamente.';
      loginFeedback.className = 'feedback-box feedback-error';
      return;
    }

    if (!foundUser.active) {
      loginFeedback.textContent = '⚠ Esta conta está desativada. Contate um Administrador da Bitzar.';
      loginFeedback.className = 'feedback-box feedback-error';
      return;
    }

    // Login efetuado com sucesso
    loginFeedback.textContent = `✅ Login efetuado com sucesso! Acessando painel como ${foundUser.name} (${foundUser.role})...`;
    loginFeedback.className = 'feedback-box feedback-success';

    setTimeout(() => {
      state.currentUser = foundUser;
      enterSystem();
    }, 650);
  });

  // Redefinição de senha
  document.getElementById('forgot-password-btn').addEventListener('click', () => {
    document.getElementById('reset-form').reset();
    document.getElementById('reset-feedback').classList.add('hidden');
    document.getElementById('reset-modal').classList.remove('hidden');
  });

  document.getElementById('reset-form').addEventListener('submit', e => {
    e.preventDefault();
    const userStr = document.getElementById('reset-username').value.trim();
    const newPass = document.getElementById('reset-new-password').value;
    const confirmPass = document.getElementById('reset-confirm-password').value;
    const fb = document.getElementById('reset-feedback');

    const user = state.users.find(u => u.username.toLowerCase() === userStr.toLowerCase());
    if (!user) {
      fb.textContent = 'Usuário não encontrado na base da Bitzar.';
      fb.className = 'feedback-box feedback-error';
      return;
    }
    if (newPass.length < 4) {
      fb.textContent = 'A nova senha deve conter pelo menos 4 caracteres.';
      fb.className = 'feedback-box feedback-error';
      return;
    }
    if (newPass !== confirmPass) {
      fb.textContent = 'As senhas informadas não coincidem.';
      fb.className = 'feedback-box feedback-error';
      return;
    }

    user.password = newPass;
    fb.textContent = '✅ Senha redefinida com sucesso! Você já pode entrar com a nova senha.';
    fb.className = 'feedback-box feedback-success';
    showToast(`Senha de ${user.name} atualizada com sucesso!`, 'success');
  });

  // =========================================================
  // 2. ENTRADA NO SISTEMA & CONTROLE DE INTERFACE POR PERFIL
  // =========================================================
  function enterSystem() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    applyRolePermissionsUI();
    switchView('dashboard');
  }

  document.getElementById('logout-btn').addEventListener('click', () => {
    state.currentUser = null;
    loginForm.reset();
    loginFeedback.classList.add('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
  });

  function applyRolePermissionsUI() {
    const user = state.currentUser;
    const role = user.role;

    document.getElementById('sidebar-avatar').src = user.avatar;
    document.getElementById('sidebar-user-name').textContent = user.name;
    document.getElementById('sidebar-user-role').textContent = role;
    document.getElementById('role-badge-topbar').textContent = `Perfil Ativo: ${role}`;

    // Exibição condicional de menus e botões por perfil (RBAC)
    const isAdmin = role === 'Administrador';
    const isManager = role === 'Gerente';
    const isDev = role === 'Desenvolvedor';

    document.getElementById('nav-admin-btn').classList.toggle('hidden', !isAdmin);
    document.getElementById('btn-new-category').classList.toggle('hidden', !isAdmin);
    document.getElementById('btn-new-module').classList.toggle('hidden', !(isDev || isAdmin));
    document.getElementById('btn-new-project').classList.toggle('hidden', !(isManager || isAdmin));
  }

  // Navegação entre telas
  function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    const titles = {
      dashboard: ['Visão Geral', 'Panorama do catálogo de módulos reutilizáveis e projetos da Bitzar'],
      catalog: ['Catálogo de Módulos', 'Selecione uma categoria para explorar os módulos e acessar seus repositórios'],
      repo: ['Repositório do Módulo', 'Visualização de estrutura de pastas, código-fonte e documentação README.md'],
      projects: ['Projetos & Requisitos', 'Acompanhamento de status, requisitos e módulos atrelados aos projetos'],
      profile: ['Meu Cadastro', 'Gerencie suas informações pessoais e credenciais de acesso'],
      admin: ['Administração do Sistema', 'Controle de privilégios RBAC, aprovação de módulos e categorias']
    };

    if (titles[viewName]) {
      document.getElementById('page-title').textContent = titles[viewName][0];
      document.getElementById('page-subtitle').textContent = titles[viewName][1];
    }

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'catalog') renderCatalogView();
    if (viewName === 'projects') renderProjectsView();
    if (viewName === 'profile') renderProfileView();
    if (viewName === 'admin') renderAdminView();
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.querySelectorAll('[data-jump-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.jumpView));
  });

  // Busca global rápida
  document.getElementById('global-search-input').addEventListener('input', e => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) return;

    const match = state.modules.find(
      m =>
        m.name.toLowerCase().includes(query) ||
        m.technology.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
    );

    if (match) {
      state.selectedCategoryId = match.categoryId;
      state.selectedModuleId = match.id;
      switchView('catalog');
    }
  });

  // =========================================================
  // 3. RENDERIZAÇÃO DO DASHBOARD
  // =========================================================
  function renderDashboard() {
    const activeMods = state.modules.filter(m => m.status === 'Ativo').length;
    const pendingMods = state.modules.filter(m => m.status === 'Em Aprovação').length;
    const runningProjs = state.projects.filter(p => p.status === 'Em Andamento' || p.status === 'Novo Projeto').length;

    document.getElementById('dashboard-stats').innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Módulos Catalogados</span>
        <div class="stat-value">${state.modules.length}</div>
        <span class="stat-sub">${activeMods} prontos para reuso</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Categorias Técnicas</span>
        <div class="stat-value">${state.categories.length}</div>
        <span class="stat-sub">Domínios padronizados</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Projetos Ativos</span>
        <div class="stat-value">${runningProjs}</div>
        <span class="stat-sub">De ${state.projects.length} projetos totais</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Aguardando Revisão</span>
        <div class="stat-value">${pendingMods}</div>
        <span class="stat-sub">Fila de homologação</span>
      </div>
    `;

    const role = state.currentUser.role;
    document.getElementById('dashboard-role-label').textContent = role;

    const matrix = {
      Desenvolvedor: [
        { ok: true, text: 'Pesquisar, visualizar módulos e explorar código-fonte / README.md' },
        { ok: true, text: 'Cadastrar novos módulos reutilizáveis no catálogo' },
        { ok: true, text: 'Editar exclusivamente os módulos criados por você' },
        { ok: false, text: 'Cadastrar projetos ou alterar privilégios de outros usuários (Restrito)' }
      ],
      Gerente: [
        { ok: true, text: 'Cadastrar novos projetos e informar requisitos do cliente' },
        { ok: true, text: 'Receber sugestões automáticas de módulos compatíveis' },
        { ok: true, text: 'Escolher e atrelar módulos do catálogo aos projetos' },
        { ok: false, text: 'Cadastrar/editar código de módulos ou alterar cargos (Restrito)' }
      ],
      Administrador: [
        { ok: true, text: 'Gerenciar usuários e alterar cargos/privilégios (RBAC)' },
        { ok: true, text: 'Aprovar, editar ou remover qualquer módulo do sistema' },
        { ok: true, text: 'Criar novas categorias e gerenciar projetos' },
        { ok: true, text: 'Acesso irrestrito a todos os repositórios e auditoria' }
      ]
    };

    document.getElementById('role-capabilities-list').innerHTML = matrix[role]
      .map(
        item => `
        <li>
          <span class="${item.ok ? 'cap-ok' : 'cap-no'}">${item.ok ? '✔' : '✖'}</span>
          <span>${item.text}</span>
        </li>`
      )
      .join('');

    document.getElementById('dashboard-recent-projects').innerHTML = state.projects
      .slice(0, 4)
      .map(
        p => `
        <div class="mini-row">
          <div>
            <strong style="color: var(--text-white);">${p.name}</strong>
            <div class="text-muted">${p.client} • ${p.attachedModuleIds.length} módulos atrelados</div>
          </div>
          <span class="status-pill ${getStatusClass(p.status)}">${p.status}</span>
        </div>`
      )
      .join('');

    document.getElementById('dashboard-categories-grid').innerHTML = state.categories
      .map(cat => {
        const count = state.modules.filter(m => m.categoryId === cat.id).length;
        return `<button type="button" class="cat-chip-btn" data-cat-jump="${cat.id}">
          ${cat.name} <span>${count}</span>
        </button>`;
      })
      .join('');

    document.querySelectorAll('[data-cat-jump]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedCategoryId = Number(btn.dataset.catJump);
        const firstMod = state.modules.find(m => m.categoryId === state.selectedCategoryId);
        state.selectedModuleId = firstMod ? firstMod.id : null;
        switchView('catalog');
      });
    });
  }

  // =========================================================
  // 4. CATÁLOGO DE MÓDULOS (SELEÇÃO DINÂMICA + GITHUB VIEWER)
  // =========================================================
  function renderCatalogView() {
    const catSelect = document.getElementById('category-select');
    const modSelect = document.getElementById('module-select');
    const statusFilter = document.getElementById('status-filter-select').value;

    catSelect.innerHTML = state.categories
      .map(c => `<option value="${c.id}" ${c.id === state.selectedCategoryId ? 'selected' : ''}>${c.name}</option>`)
      .join('');

    const filteredModules = state.modules.filter(m => {
      const matchCat = m.categoryId === state.selectedCategoryId;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchCat && matchStatus;
    });

    if (!filteredModules.some(m => m.id === state.selectedModuleId)) {
      state.selectedModuleId = filteredModules.length > 0 ? filteredModules[0].id : null;
    }

    modSelect.innerHTML = filteredModules.length
      ? filteredModules
          .map(m => `<option value="${m.id}" ${m.id === state.selectedModuleId ? 'selected' : ''}>${m.name}</option>`)
          .join('')
      : '<option value="">Nenhum módulo nesta categoria</option>';

    const currentCat = getCategoryById(state.selectedCategoryId);
    document.getElementById('selected-category-title').textContent = `Categoria: ${currentCat ? currentCat.name : ''}`;
    document.getElementById('category-count-badge').textContent = `${filteredModules.length} módulo(s)`;

    const listEl = document.getElementById('category-modules-list');
    if (filteredModules.length === 0) {
      listEl.innerHTML = `<p class="text-muted">Nenhum módulo cadastrado nesta categoria com o filtro atual.</p>`;
      document.getElementById('module-inspector-panel').innerHTML = `<p class="text-muted">Selecione ou cadastre um módulo para visualizar seus detalhes.</p>`;
      return;
    }

    listEl.innerHTML = filteredModules
      .map(m => {
        const author = getUserById(m.authorId);
        return `
        <div class="module-list-item ${m.id === state.selectedModuleId ? 'active' : ''}" data-select-mod="${m.id}">
          <div class="module-item-top">
            <strong>${m.name}</strong>
            <span class="status-pill ${getStatusClass(m.status)}">${m.status}</span>
          </div>
          <div class="module-item-meta">
            <span>${m.technology}</span>
            <span>Por: ${author ? author.name : 'Bitzar'}</span>
          </div>
        </div>`;
      })
      .join('');

    document.querySelectorAll('[data-select-mod]').forEach(el => {
      el.addEventListener('click', () => {
        state.selectedModuleId = Number(el.dataset.selectMod);
        renderCatalogView();
      });
    });

    renderModuleInspector();
  }

  document.getElementById('category-select').addEventListener('change', e => {
    state.selectedCategoryId = Number(e.target.value);
    const first = state.modules.find(m => m.categoryId === state.selectedCategoryId);
    state.selectedModuleId = first ? first.id : null;
    renderCatalogView();
  });

  document.getElementById('module-select').addEventListener('change', e => {
    state.selectedModuleId = Number(e.target.value);
    renderCatalogView();
  });

  document.getElementById('status-filter-select').addEventListener('change', renderCatalogView);

  function renderModuleInspector() {
    const mod = state.modules.find(m => m.id === state.selectedModuleId);
    const panel = document.getElementById('module-inspector-panel');
    if (!mod) return;

    const cat = getCategoryById(mod.categoryId);
    const author = getUserById(mod.authorId);
    const role = state.currentUser.role;

    // Permissão de edição: Administrador edita tudo; Desenvolvedor edita apenas os próprios módulos
    const canEdit = role === 'Administrador' || (role === 'Desenvolvedor' && mod.authorId === state.currentUser.id);
    const canDelete = role === 'Administrador';

    panel.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-title">
          <div style="display:flex; align-items:center; gap:10px;">
            <h2>${mod.name}</h2>
            <span class="status-pill ${getStatusClass(mod.status)}">${mod.status}</span>
          </div>
          <span class="text-muted">ID #${mod.id} • Categoria: <strong>${cat ? cat.name : '-'}</strong></span>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" id="open-github-repo-btn">
            📁 Abrir Código &amp; README (GitHub)
          </button>
          ${
            canEdit
              ? `<button type="button" class="btn btn-secondary" id="edit-module-btn">✎ Editar</button>`
              : `<button type="button" class="btn btn-secondary" disabled title="Você só pode editar módulos criados por você">🔒 Somente Leitura</button>`
          }
          ${canDelete ? `<button type="button" class="btn btn-outline-danger" id="delete-module-btn">Excluir</button>` : ''}
        </div>
      </div>

      <div class="inspector-grid">
        <div class="field-card full">
          <span>Descrição Funcional</span>
          <p>${mod.description}</p>
        </div>
        <div class="field-card">
          <span>Tecnologia Principal</span>
          <strong>${mod.technology}</strong>
        </div>
        <div class="field-card">
          <span>Versão</span>
          <strong>${mod.version}</strong>
        </div>
        <div class="field-card">
          <span>Criado Por</span>
          <strong>${author ? `${author.name} (${author.username})` : 'Equipe Bitzar'}</strong>
        </div>
        <div class="field-card">
          <span>Dependências</span>
          <strong>${mod.dependencies || 'Nenhuma dependência externa'}</strong>
        </div>
        <div class="field-card">
          <span>Link do Código / Repositório</span>
          <a href="${mod.link}" target="_blank" rel="noopener noreferrer" class="link-btn">${mod.link} &#8599;</a>
        </div>
        <div class="field-card">
          <span>Documentação de Referência</span>
          <a href="${mod.docLink}" target="_blank" rel="noopener noreferrer" class="link-btn">${mod.docLink} &#8599;</a>
        </div>
      </div>
    `;

    document.getElementById('open-github-repo-btn').addEventListener('click', () => {
      openGitHubRepoView(mod.id);
    });

    if (canEdit) {
      document.getElementById('edit-module-btn').addEventListener('click', () => openModuleFormModal(mod));
    }
    if (canDelete) {
      document.getElementById('delete-module-btn').addEventListener('click', () => {
        state.modules = state.modules.filter(item => item.id !== mod.id);
        showToast(`Módulo "${mod.name}" removido do catálogo.`, 'info');
        renderCatalogView();
      });
    }
  }

  // Visualização Estilo GitHub do Módulo
  function openGitHubRepoView(moduleId) {
    state.activeRepoModuleId = moduleId;
    const mod = state.modules.find(m => m.id === moduleId);
    if (!mod) return;

    const cat = getCategoryById(mod.categoryId);
    const author = getUserById(mod.authorId);
    const fileNames = Object.keys(mod.files);
    if (!fileNames.includes(state.activeRepoFile)) {
      state.activeRepoFile = fileNames[0];
    }

    document.getElementById('gh-category-slug').textContent = slugify(cat ? cat.name : 'geral');
    document.getElementById('gh-module-slug').textContent = slugify(mod.name);
    const stBadge = document.getElementById('gh-status-badge');
    stBadge.textContent = mod.status;
    stBadge.className = `status-pill ${getStatusClass(mod.status)}`;

    document.getElementById('gh-tech').textContent = mod.technology;
    document.getElementById('gh-version').textContent = mod.version;
    document.getElementById('gh-author').textContent = author ? author.name : 'Bitzar';
    document.getElementById('gh-external-doc-link').href = mod.docLink;

    // Ações no topo do repositório
    const role = state.currentUser.role;
    const canEdit = role === 'Administrador' || (role === 'Desenvolvedor' && mod.authorId === state.currentUser.id);
    const actionsDiv = document.getElementById('repo-owner-actions');
    actionsDiv.innerHTML = canEdit
      ? `<button type="button" class="btn btn-secondary" id="repo-edit-btn">✎ Editar Código / Documentação</button>`
      : `<span class="permission-pill">Modo Leitura (${role})</span>`;

    if (canEdit) {
      document.getElementById('repo-edit-btn').addEventListener('click', () => openModuleFormModal(mod));
    }

    renderRepoFilesAndCode(mod);
    renderMarkdownReadme(mod.files['README.md'] || '');
    switchView('repo');
  }

  function renderRepoFilesAndCode(mod) {
    const treeList = document.getElementById('gh-files-list');
    const fileNames = Object.keys(mod.files);

    treeList.innerHTML = fileNames
      .map(fname => {
        const icon = fname.endsWith('.md') ? '📘' : fname.endsWith('.json') ? '📦' : '📄';
        return `<li class="gh-tree-item ${fname === state.activeRepoFile ? 'active' : ''}" data-file="${fname}">
          <span>${icon}</span>
          <span>${fname}</span>
        </li>`;
      })
      .join('');

    treeList.querySelectorAll('.gh-tree-item').forEach(li => {
      li.addEventListener('click', () => {
        state.activeRepoFile = li.dataset.file;
        renderRepoFilesAndCode(mod);
      });
    });

    const content = mod.files[state.activeRepoFile] || '';
    document.getElementById('gh-active-filename').textContent = state.activeRepoFile;
    document.getElementById('gh-file-lines').textContent = `${content.split('\n').length} linhas`;
    document.getElementById('gh-code-content').textContent = content;
  }

  function renderMarkdownReadme(mdText) {
    // Conversão simples e segura de Markdown básico para HTML visual estilo GitHub
    let html = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```[\s\S]*?```/g, match => {
        const clean = match.replace(/```[a-z]*\n?/i, '').replace(/```$/, '');
        return `<pre><code>${clean}</code></pre>`;
      })
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:#161b22;padding:2px 6px;border-radius:4px;">$1</code>')
      .replace(/\n/g, '<br>');
    document.getElementById('gh-readme-body').innerHTML = html;
  }

  document.getElementById('gh-copy-code-btn').addEventListener('click', () => {
    const code = document.getElementById('gh-code-content').textContent;
    navigator.clipboard?.writeText(code);
    showToast('Código copiado para a área de transferência!', 'success');
  });

  document.getElementById('back-to-catalog-btn').addEventListener('click', () => switchView('catalog'));

  // Modal Cadastro/Edição de Módulo
  document.getElementById('btn-new-module').addEventListener('click', () => openModuleFormModal(null));

  function openModuleFormModal(modToEdit) {
    const modal = document.getElementById('module-form-modal');
    const catSelect = document.getElementById('mod-category');
    catSelect.innerHTML = state.categories
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    const statusSelect = document.getElementById('mod-status');
    // Desenvolvedor cadastra como "Em Aprovação"; Administrador pode definir "Ativo" direto
    statusSelect.disabled = state.currentUser.role !== 'Administrador';

    if (modToEdit) {
      document.getElementById('module-modal-title').textContent = `Editar Módulo: ${modToEdit.name}`;
      document.getElementById('mod-edit-id').value = modToEdit.id;
      document.getElementById('mod-name').value = modToEdit.name;
      catSelect.value = modToEdit.categoryId;
      document.getElementById('mod-description').value = modToEdit.description;
      document.getElementById('mod-tech').value = modToEdit.technology;
      document.getElementById('mod-version').value = modToEdit.version;
      statusSelect.value = modToEdit.status;
      document.getElementById('mod-link').value = modToEdit.link;
      document.getElementById('mod-doc-link').value = modToEdit.docLink;
      document.getElementById('mod-dependencies').value = modToEdit.dependencies || '';
      document.getElementById('mod-code').value = modToEdit.files['src/index.js'] || '';
      document.getElementById('mod-readme').value = modToEdit.files['README.md'] || '';
    } else {
      document.getElementById('module-modal-title').textContent = 'Cadastrar Novo Módulo Reutilizável';
      document.getElementById('module-form').reset();
      document.getElementById('mod-edit-id').value = '';
      catSelect.value = state.selectedCategoryId;
      statusSelect.value = state.currentUser.role === 'Administrador' ? 'Ativo' : 'Em Aprovação';
    }

    modal.classList.remove('hidden');
  }

  document.getElementById('module-form').addEventListener('submit', e => {
    e.preventDefault();
    const editId = document.getElementById('mod-edit-id').value;
    const name = document.getElementById('mod-name').value.trim();
    const categoryId = Number(document.getElementById('mod-category').value);
    const description = document.getElementById('mod-description').value.trim();
    const technology = document.getElementById('mod-tech').value.trim();
    const version = document.getElementById('mod-version').value.trim();
    const status = document.getElementById('mod-status').value;
    const link = document.getElementById('mod-link').value.trim() || 'https://github.com/bitzar/modules';
    const docLink = document.getElementById('mod-doc-link').value.trim() || link;
    const dependencies = document.getElementById('mod-dependencies').value.trim();
    const code =
      document.getElementById('mod-code').value.trim() ||
      `// Código-fonte do módulo ${name}\nexport function executar() {\n  return { modulo: '${name}', status: 'ok' };\n}`;
    const readme =
      document.getElementById('mod-readme').value.trim() ||
      `# ${name}\n\n${description}\n\n## Tecnologia\n- ${technology} (${version})`;

    if (editId) {
      const mod = state.modules.find(m => m.id === Number(editId));
      if (mod) {
        Object.assign(mod, { name, categoryId, description, technology, version, status, link, docLink, dependencies });
        mod.files['src/index.js'] = code;
        mod.files['README.md'] = readme;
        showToast(`Módulo "${name}" atualizado com sucesso!`, 'success');
      }
    } else {
      const newId = Math.max(...state.modules.map(m => m.id), 0) + 1;
      const newMod = {
        id: newId,
        name,
        description,
        categoryId,
        technology,
        version,
        status,
        link,
        docLink,
        authorId: state.currentUser.id,
        dependencies,
        files: buildRepoFiles(slugify(name), technology, code, readme)
      };
      state.modules.push(newMod);
      state.selectedCategoryId = categoryId;
      state.selectedModuleId = newId;
      showToast(
        status === 'Em Aprovação'
          ? `Módulo "${name}" cadastrado e enviado para aprovação do Administrador!`
          : `Módulo "${name}" publicado no catálogo!`,
        'success'
      );
    }

    document.getElementById('module-form-modal').classList.add('hidden');
    if (!document.getElementById('view-repo').classList.contains('hidden') && editId) {
      openGitHubRepoView(Number(editId));
    } else {
      renderCatalogView();
    }
  });

  // =========================================================
  // 5. PROJETOS CADASTRADOS, STATUS & SUGESTÃO DE MÓDULOS
  // =========================================================
  function renderProjectsView() {
    const grid = document.getElementById('projects-grid');
    const filtered =
      state.projectStatusFilter === 'all'
        ? state.projects
        : state.projects.filter(p => p.status === state.projectStatusFilter);

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="panel"><p class="text-muted">Nenhum projeto encontrado com o status "${state.projectStatusFilter}".</p></div>`;
      return;
    }

    grid.innerHTML = filtered
      .map(proj => {
        const linkedModules = proj.attachedModuleIds
          .map(id => state.modules.find(m => m.id === id))
          .filter(Boolean);

        const collabs = proj.collaboratorIds
          .map(id => getUserById(id))
          .filter(Boolean)
          .map(u => u.name)
          .join(', ');

        return `
        <article class="project-card">
          <div>
            <div class="project-card-top">
              <div>
                <span class="client-label">🏢 ${proj.client}</span>
                <h3>${proj.name}</h3>
              </div>
              <span class="status-pill ${getStatusClass(proj.status)}">${proj.status}</span>
            </div>

            <p class="text-muted" style="margin: 10px 0;">${proj.description}</p>

            <div style="margin-bottom: 10px;">
              <small class="text-muted" style="display:block; margin-bottom:4px;">Requisitos do Projeto:</small>
              <div class="tags-wrap">
                ${proj.requirements.map(r => `<span class="req-tag">${r}</span>`).join('')}
              </div>
            </div>

            <div>
              <small class="text-muted" style="display:block; margin-bottom:4px;">
                Módulos Atrelados (${linkedModules.length}):
              </small>
              <div class="tags-wrap">
                ${
                  linkedModules.length
                    ? linkedModules.map(m => `<span class="mod-linked-tag">◫ ${m.name}</span>`).join('')
                    : '<small class="text-muted">Nenhum módulo vinculado ainda</small>'
                }
              </div>
            </div>
          </div>

          <div>
            <div class="project-dates">
              <span>Inclusão: <strong>${proj.createdAt}</strong></span>
              <span>Finalização: <strong>${proj.finishedAt || 'Em aberto'}</strong></span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
              <small class="text-muted">👥 ${collabs || 'Sem colaboradores'}</small>
              <button type="button" class="btn btn-sm btn-secondary" data-open-project="${proj.id}">
                Detalhes &amp; Módulos &rarr;
              </button>
            </div>
          </div>
        </article>`;
      })
      .join('');

    document.querySelectorAll('[data-open-project]').forEach(btn => {
      btn.addEventListener('click', () => openProjectDetailModal(Number(btn.dataset.openProject)));
    });
  }

  document.querySelectorAll('#project-status-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#project-status-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.projectStatusFilter = btn.dataset.status;
      renderProjectsView();
    });
  });

  // Detalhes completos do projeto + gestão de módulos vinculados
  function openProjectDetailModal(projectId) {
    const proj = state.projects.find(p => p.id === projectId);
    if (!proj) return;

    const canManageProject = state.currentUser.role === 'Gerente' || state.currentUser.role === 'Administrador';
    const suggested = suggestModulesByKeywords(proj.requirements);

    document.getElementById('detail-proj-title').textContent = proj.name;
    document.getElementById('detail-proj-client').textContent = `Empresa Cliente: ${proj.client}`;

    const body = document.getElementById('project-detail-body');
    body.innerHTML = `
      <div class="inspector-grid">
        <div class="field-card full">
          <span>Descrição Completa</span>
          <p>${proj.description}</p>
        </div>
        <div class="field-card">
          <span>Status Atual</span>
          ${
            canManageProject
              ? `<select id="detail-status-select" style="margin-top:4px; width:100%;">
                  ${['Novo Projeto', 'Em Andamento', 'Em Avaliação', 'Aprovado', 'Reprovado', 'Finalizado']
                    .map(st => `<option value="${st}" ${st === proj.status ? 'selected' : ''}>${st}</option>`)
                    .join('')}
                </select>`
              : `<strong>${proj.status}</strong>`
          }
        </div>
        <div class="field-card">
          <span>Datas do Cronograma</span>
          <strong>Inclusão: ${proj.createdAt} | Finalização: ${proj.finishedAt || 'A definir'}</strong>
        </div>
        <div class="field-card full">
          <span>Usuários Colaboradores</span>
          <div class="tags-wrap" style="margin-top:6px;">
            ${proj.collaboratorIds
              .map(id => getUserById(id))
              .filter(Boolean)
              .map(u => `<span class="req-tag">${u.name} (${u.role})</span>`)
              .join('')}
          </div>
        </div>
        <div class="field-card full">
          <span>Requisitos Cadastrados</span>
          <div class="tags-wrap" style="margin-top:6px;">
            ${proj.requirements.map(r => `<span class="req-tag">${r}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="suggestion-engine-box mb-16">
        <div class="suggestion-header">
          ⚡ Módulos Sugeridos pelo Catálogo (Baseado nos Requisitos)
        </div>
        <div class="suggestion-chips">
          ${
            suggested.length
              ? suggested
                  .map(m => {
                    const isLinked = proj.attachedModuleIds.includes(m.id);
                    return `<button type="button" class="btn btn-sm ${isLinked ? 'btn-success' : 'btn-secondary'}" data-toggle-proj-mod="${m.id}" ${!canManageProject ? 'disabled' : ''}>
                      ${isLinked ? '✔ Atrelado:' : '+ Atrelar:'} ${m.name} (${m.technology})
                    </button>`;
                  })
                  .join('')
              : '<small class="text-muted">Nenhuma correspondência automática encontrada.</small>'
          }
        </div>
      </div>

      <div>
        <h4 style="color:var(--text-white); margin-bottom:8px;">Módulos Utilizados / Atrelados ao Projeto</h4>
        <div class="mini-list">
          ${
            proj.attachedModuleIds.length
              ? proj.attachedModuleIds
                  .map(id => state.modules.find(m => m.id === id))
                  .filter(Boolean)
                  .map(
                    m => `
                  <div class="mini-row">
                    <div>
                      <strong style="color:var(--text-white);">${m.name}</strong>
                      <small class="text-muted"> • ${m.technology} (${m.version})</small>
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button type="button" class="btn btn-sm btn-ghost" data-jump-repo="${m.id}">Ver Código</button>
                      ${
                        canManageProject
                          ? `<button type="button" class="btn btn-sm btn-outline-danger" data-toggle-proj-mod="${m.id}">Remover</button>`
                          : ''
                      }
                    </div>
                  </div>`
                  )
                  .join('')
              : '<p class="text-muted">Nenhum módulo atrelado.</p>'
          }
        </div>
      </div>
    `;

    const statusSel = document.getElementById('detail-status-select');
    if (statusSel) {
      statusSel.addEventListener('change', e => {
        proj.status = e.target.value;
        showToast(`Status do projeto alterado para "${proj.status}".`, 'success');
        renderProjectsView();
      });
    }

    body.querySelectorAll('[data-toggle-proj-mod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modId = Number(btn.dataset.toggleProjMod);
        if (proj.attachedModuleIds.includes(modId)) {
          proj.attachedModuleIds = proj.attachedModuleIds.filter(id => id !== modId);
        } else {
          proj.attachedModuleIds.push(modId);
        }
        openProjectDetailModal(proj.id);
        renderProjectsView();
      });
    });

    body.querySelectorAll('[data-jump-repo]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('project-detail-modal').classList.add('hidden');
        openGitHubRepoView(Number(btn.dataset.jumpRepo));
      });
    });

    document.getElementById('project-detail-modal').classList.remove('hidden');
  }

  // Novo Projeto (Gerente / Admin) com sugestão em tempo real
  document.getElementById('btn-new-project').addEventListener('click', () => {
    document.getElementById('project-form').reset();
    document.getElementById('proj-start-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('live-module-suggestions').innerHTML =
      '<small class="text-muted">Digite os requisitos acima para ver módulos compatíveis...</small>';

    document.getElementById('proj-collaborators-checkboxes').innerHTML = state.users
      .map(
        u => `
        <label class="check-pill">
          <input type="checkbox" name="proj-collab" value="${u.id}" ${u.id === state.currentUser.id ? 'checked' : ''} />
          <span>${u.name} (${u.role})</span>
        </label>`
      )
      .join('');

    document.getElementById('project-form-modal').classList.remove('hidden');
  });

  document.getElementById('proj-requirements').addEventListener('input', e => {
    const keys = e.target.value.split(',');
    const matches = suggestModulesByKeywords(keys);
    const box = document.getElementById('live-module-suggestions');

    if (!matches.length) {
      box.innerHTML = '<small class="text-muted">Nenhum módulo compatível encontrado ainda...</small>';
      return;
    }

    box.innerHTML = matches
      .map(
        m => `
        <label class="check-pill">
          <input type="checkbox" name="suggested-mod" value="${m.id}" checked />
          <span>◫ ${m.name} (${m.technology})</span>
        </label>`
      )
      .join('');
  });

  document.getElementById('project-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('proj-name').value.trim();
    const client = document.getElementById('proj-client').value.trim();
    const description = document.getElementById('proj-description').value.trim();
    const status = document.getElementById('proj-status').value;
    const createdAt = document.getElementById('proj-start-date').value;
    const finishedAt = document.getElementById('proj-end-date').value;
    const requirements = document
      .getElementById('proj-requirements')
      .value.split(',')
      .map(r => r.trim())
      .filter(Boolean);

    const attachedModuleIds = Array.from(document.querySelectorAll('input[name="suggested-mod"]:checked')).map(cb =>
      Number(cb.value)
    );
    const collaboratorIds = Array.from(document.querySelectorAll('input[name="proj-collab"]:checked')).map(cb =>
      Number(cb.value)
    );

    const newProj = {
      id: Math.max(...state.projects.map(p => p.id), 100) + 1,
      name,
      client,
      description,
      status,
      requirements,
      attachedModuleIds,
      createdAt,
      finishedAt,
      collaboratorIds
    };

    state.projects.unshift(newProj);
    document.getElementById('project-form-modal').classList.add('hidden');
    showToast(`Projeto "${name}" criado com ${attachedModuleIds.length} módulo(s) vinculado(s)!`, 'success');
    renderProjectsView();
  });

  // =========================================================
  // 6. TELA DE CADASTRO DO USUÁRIO (COM TRAVA DE PRIVILÉGIOS)
  // =========================================================
  function renderProfileView() {
    const user = state.currentUser;
    const isAdmin = user.role === 'Administrador';

    document.getElementById('profile-preview-avatar').src = user.avatar;
    document.getElementById('profile-role-display').textContent = user.role;

    document.getElementById('prof-name').value = user.name;
    document.getElementById('prof-username').value = user.username;
    document.getElementById('prof-email').value = user.email;
    document.getElementById('prof-specialty').value = user.specialty || '';
    document.getElementById('prof-password').value = '';

    const roleSelect = document.getElementById('prof-role-select');
    roleSelect.value = user.role;
    roleSelect.disabled = !isAdmin;

    document.getElementById('role-lock-icon').textContent = isAdmin ? '🔓' : '🔒';
    document.getElementById('profile-role-hint').textContent = isAdmin
      ? 'Você possui privilégios totais de Administrador.'
      : 'Seu cargo é gerenciado exclusivamente por um Administrador.';

    document.getElementById('profile-permission-alert').textContent = isAdmin
      ? 'Modo Administrador: Você pode alterar seus dados, seu próprio cargo ou gerenciar outros usuários na aba Administração.'
      : `Segurança RBAC ativa: Como ${user.role}, você pode editar seu nome, foto, e-mail e senha, mas não pode elevar seus privilégios.`;

    // Presets de avatar
    document.getElementById('avatar-presets-row').innerHTML = AVATAR_PRESETS.map(
      (svgUrl, idx) => `
      <button type="button" class="preset-avatar-btn" data-preset-idx="${idx}">
        <img src="${svgUrl}" alt="Avatar ${idx + 1}" />
      </button>`
    ).join('');

    document.querySelectorAll('[data-preset-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = AVATAR_PRESETS[Number(btn.dataset.presetIdx)];
        user.avatar = chosen;
        document.getElementById('profile-preview-avatar').src = chosen;
        document.getElementById('sidebar-avatar').src = chosen;
        showToast('Avatar atualizado!', 'success');
      });
    });
  }

  // Upload de foto de perfil local via FileReader
  document.getElementById('profile-photo-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.currentUser.avatar = ev.target.result;
      document.getElementById('profile-preview-avatar').src = ev.target.result;
      document.getElementById('sidebar-avatar').src = ev.target.result;
      showToast('Foto de perfil carregada com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('profile-form').addEventListener('submit', e => {
    e.preventDefault();
    const user = state.currentUser;
    user.name = document.getElementById('prof-name').value.trim();
    user.username = document.getElementById('prof-username').value.trim();
    user.email = document.getElementById('prof-email').value.trim();
    user.specialty = document.getElementById('prof-specialty').value.trim();

    const newPass = document.getElementById('prof-password').value;
    if (newPass) {
      user.password = newPass;
    }

    // Somente Administrador pode alterar cargo
    if (user.role === 'Administrador') {
      user.role = document.getElementById('prof-role-select').value;
    }

    applyRolePermissionsUI();
    renderProfileView();
    showToast('Informações de cadastro salvas com sucesso!', 'success');
  });

  // =========================================================
  // 7. PAINEL ADMINISTRATIVO (USUÁRIOS, APROVAÇÕES E CATEGORIAS)
  // =========================================================
  function renderAdminView() {
    if (state.currentUser.role !== 'Administrador') return;

    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = state.users
      .map(
        u => `
        <tr>
          <td>#${u.id}</td>
          <td><strong style="color:var(--text-white);">${u.name}</strong></td>
          <td>${u.username}</td>
          <td>
            <select data-admin-role-user="${u.id}">
              <option value="Desenvolvedor" ${u.role === 'Desenvolvedor' ? 'selected' : ''}>Desenvolvedor</option>
              <option value="Gerente" ${u.role === 'Gerente' ? 'selected' : ''}>Gerente</option>
              <option value="Administrador" ${u.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn btn-sm ${u.active ? 'btn-success' : 'btn-outline-danger'}" data-toggle-user-active="${u.id}">
              ${u.active ? 'Ativo' : 'Inativo'}
            </button>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-admin-role-user]').forEach(sel => {
      sel.addEventListener('change', e => {
        const targetUser = getUserById(sel.dataset.adminRoleUser);
        if (targetUser) {
          targetUser.role = e.target.value;
          showToast(`Privilégio de ${targetUser.name} alterado para ${targetUser.role}.`, 'success');
          if (targetUser.id === state.currentUser.id) applyRolePermissionsUI();
        }
      });
    });

    tbody.querySelectorAll('[data-toggle-user-active]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetUser = getUserById(btn.dataset.toggleUserActive);
        if (targetUser.id === state.currentUser.id) {
          showToast('Você não pode desativar sua própria conta ativa.', 'error');
          return;
        }
        targetUser.active = !targetUser.active;
        renderAdminView();
      });
    });

    // Fila de módulos em aprovação
    const pending = state.modules.filter(m => m.status === 'Em Aprovação');
    const pendingBox = document.getElementById('admin-pending-modules');
    pendingBox.innerHTML = pending.length
      ? pending
          .map(
            m => `
          <div class="mini-row">
            <div>
              <strong style="color:var(--text-white);">${m.name}</strong>
              <div class="text-muted">${m.technology} • Autor: ${getUserById(m.authorId)?.name || '-'}</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-sm btn-success" data-approve-mod="${m.id}">Aprovar</button>
              <button type="button" class="btn btn-sm btn-outline-danger" data-reject-mod="${m.id}">Reprovar</button>
            </div>
          </div>`
          )
          .join('')
      : '<p class="text-muted">Nenhum módulo pendente de aprovação no momento.</p>';

    pendingBox.querySelectorAll('[data-approve-mod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mod = state.modules.find(m => m.id === Number(btn.dataset.approveMod));
        if (mod) {
          mod.status = 'Ativo';
          showToast(`Módulo "${mod.name}" aprovado e liberado no catálogo!`, 'success');
          renderAdminView();
        }
      });
    });

    pendingBox.querySelectorAll('[data-reject-mod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mod = state.modules.find(m => m.id === Number(btn.dataset.rejectMod));
        if (mod) {
          mod.status = 'Inativo';
          showToast(`Módulo "${mod.name}" reprovado.`, 'info');
          renderAdminView();
        }
      });
    });

    // Lista de categorias
    document.getElementById('admin-cat-total').textContent = state.categories.length;
    document.getElementById('admin-categories-list').innerHTML = state.categories
      .map(c => `<span class="req-tag">${c.id}. ${c.name}</span>`)
      .join('');
  }

  // Modal Nova Categoria
  document.getElementById('btn-new-category').addEventListener('click', () => {
    document.getElementById('category-form').reset();
    document.getElementById('category-form-modal').classList.remove('hidden');
  });
  document.getElementById('admin-add-cat-btn').addEventListener('click', () => {
    document.getElementById('category-form').reset();
    document.getElementById('category-form-modal').classList.remove('hidden');
  });

  document.getElementById('category-form').addEventListener('submit', e => {
    e.preventDefault();
    const catName = document.getElementById('new-category-name').value.trim();
    if (!catName) return;

    const newId = Math.max(...state.categories.map(c => c.id), 0) + 1;
    state.categories.push({ id: newId, name: catName });
    document.getElementById('category-form-modal').classList.add('hidden');
    showToast(`Categoria "${catName}" criada com sucesso!`, 'success');
    renderCatalogView();
    renderAdminView();
  });

  // Fechar modais
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeModal).classList.add('hidden');
    });
  });
});