import { supabase, isSupabaseConfigured, SEED_PROJECTS, SEED_BRANDS } from '../supabaseClient.js';

// ==================== STATE ====================
let currentUser = null;
let projectsList = [];
let brandsList = [];
let deleteTargetId = null;
let deleteBrandTargetId = null;
let selectedGalleryFiles = [];
let existingGalleryItems = [];

// ==================== DOM ELEMENTS ====================
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const headerActions = document.getElementById('headerActions');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const configAlert = document.getElementById('configAlert');

// Auth elements
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Dashboard elements
const statTotal = document.getElementById('statTotal');
const statBrands = document.getElementById('statBrands');
const statPublished = document.getElementById('statPublished');
const statDrafts = document.getElementById('statDrafts');
const searchInput = document.getElementById('searchInput');
const brandFilter = document.getElementById('brandFilter');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const projectsTableBody = document.getElementById('projectsTableBody');
const tableEmpty = document.getElementById('tableEmpty');
const addProjectBtn = document.getElementById('addProjectBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');
const manageBrandsBtn = document.getElementById('manageBrandsBtn');
const headerManageBrandsBtn = document.getElementById('headerManageBrandsBtn');

// Project Modal elements
const projectModal = document.getElementById('projectModal');
const projectModalBackdrop = document.getElementById('projectModalBackdrop');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const projectForm = document.getElementById('projectForm');
const modalTitle = document.getElementById('modalTitle');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const modalAlert = document.getElementById('modalAlert');
const inlineAddBrandBtn = document.getElementById('inlineAddBrandBtn');

// Form inputs
const projectIdInput = document.getElementById('projectId');
const projectTitle = document.getElementById('projectTitle');
const projectBrand = document.getElementById('projectBrand');
const projectClient = document.getElementById('projectClient');
const projectCategory = document.getElementById('projectCategory');
const projectCategoryLabel = document.getElementById('projectCategoryLabel');
const projectBadge = document.getElementById('projectBadge');
const projectSortOrder = document.getElementById('projectSortOrder');
const projectDesc = document.getElementById('projectDesc');
const projectDetailedDesc = document.getElementById('projectDetailedDesc');
const projectPublished = document.getElementById('projectPublished');
const projectFeatured = document.getElementById('projectFeatured');

// Media inputs
const mediaTypeRadios = document.querySelectorAll('input[name="mediaType"]');
const videoFieldGroup = document.getElementById('videoFieldGroup');
const galleryFieldGroup = document.getElementById('galleryFieldGroup');

const thumbnailFileInput = document.getElementById('thumbnailFileInput');
const thumbnailPlaceholder = document.getElementById('thumbnailPlaceholder');
const thumbnailPreviewWrap = document.getElementById('thumbnailPreviewWrap');
const thumbnailPreviewImg = document.getElementById('thumbnailPreviewImg');
const removeThumbnailBtn = document.getElementById('removeThumbnailBtn');
const projectThumbnailUrl = document.getElementById('projectThumbnailUrl');

const videoFileInput = document.getElementById('videoFileInput');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const videoPreviewWrap = document.getElementById('videoPreviewWrap');
const videoPreviewEl = document.getElementById('videoPreviewEl');
const removeVideoBtn = document.getElementById('removeVideoBtn');
const projectVideoUrl = document.getElementById('projectVideoUrl');

const galleryFileInput = document.getElementById('galleryFileInput');
const galleryPreviewStrip = document.getElementById('galleryPreviewStrip');
const projectGalleryUrls = document.getElementById('projectGalleryUrls');

// Brand Modal elements
const brandModal = document.getElementById('brandModal');
const brandModalBackdrop = document.getElementById('brandModalBackdrop');
const brandModalCloseBtn = document.getElementById('brandModalCloseBtn');
const brandModalDoneBtn = document.getElementById('brandModalDoneBtn');
const brandForm = document.getElementById('brandForm');
const brandFormTitle = document.getElementById('brandFormTitle');
const brandEditId = document.getElementById('brandEditId');
const brandNameInput = document.getElementById('brandNameInput');
const brandSlugInput = document.getElementById('brandSlugInput');
const brandSortOrderInput = document.getElementById('brandSortOrderInput');
const saveBrandBtn = document.getElementById('saveBrandBtn');
const brandFormResetBtn = document.getElementById('brandFormResetBtn');
const brandFormError = document.getElementById('brandFormError');
const brandsTableBody = document.getElementById('brandsTableBody');
const brandTableEmpty = document.getElementById('brandTableEmpty');
const brandListCount = document.getElementById('brandListCount');

// Delete Brand modal elements
const deleteBrandModal = document.getElementById('deleteBrandModal');
const deleteBrandModalBackdrop = document.getElementById('deleteBrandModalBackdrop');
const deleteBrandModalCloseBtn = document.getElementById('deleteBrandModalCloseBtn');
const deleteBrandCancelBtn = document.getElementById('deleteBrandCancelBtn');
const deleteBrandConfirmBtn = document.getElementById('deleteBrandConfirmBtn');
const deleteBrandName = document.getElementById('deleteBrandName');
const brandDeleteWarningWrap = document.getElementById('brandDeleteWarningWrap');
const brandDeleteConfirmWrap = document.getElementById('brandDeleteConfirmWrap');
const brandInUseMsg = document.getElementById('brandInUseMsg');

// Delete Project modal
const deleteModal = document.getElementById('deleteModal');
const deleteModalBackdrop = document.getElementById('deleteModalBackdrop');
const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const deleteProjectTitle = document.getElementById('deleteProjectTitle');

// Toast
const adminToast = document.getElementById('adminToast');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  initEventListeners();
  checkConfiguration();
  await checkAuthSession();
});

function checkConfiguration() {
  const demoAuthBox = document.getElementById('demoAuthBox');
  const authDivider = document.getElementById('authDivider');

  if (!isSupabaseConfigured()) {
    if (demoAuthBox) demoAuthBox.style.display = 'block';
    if (authDivider) authDivider.style.display = 'flex';
    configAlert.style.display = 'none';
  } else {
    if (demoAuthBox) demoAuthBox.style.display = 'none';
    if (authDivider) authDivider.style.display = 'none';
    configAlert.style.display = 'block';
    configAlert.className = 'alert alert--info';
    configAlert.innerHTML = `
      <strong>Connected to Supabase:</strong> Live backend connection active. Sign in with your registered admin credentials.
    `;
  }
}

// ==================== AUTHENTICATION ====================
async function checkAuthSession() {
  if (!isSupabaseConfigured()) {
    const demoSession = localStorage.getItem('btt_admin_demo_session');
    if (demoSession) {
      currentUser = { email: 'admin@bendthetrend.com' };
      showDashboard();
    } else {
      showAuth();
    }
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      currentUser = session.user;
      showDashboard();
    } else {
      showAuth();
    }
  } catch (err) {
    console.error('Session check error:', err);
    showAuth();
  }
}

function showAuth() {
  authSection.style.display = 'flex';
  dashboardSection.style.display = 'none';
  headerActions.style.display = 'none';
}

async function showDashboard() {
  authSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  headerActions.style.display = 'flex';
  userEmailDisplay.textContent = currentUser?.email || 'admin@bendthetrend.com';
  
  await loadBrands();
  await loadProjects();
}

async function handleLogin(e) {
  e.preventDefault();
  loginError.style.display = 'none';
  setButtonLoading(loginSubmitBtn, true);

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!isSupabaseConfigured()) {
    setTimeout(async () => {
      localStorage.setItem('btt_admin_demo_session', JSON.stringify({ email }));
      currentUser = { email };
      setButtonLoading(loginSubmitBtn, false);
      await showDashboard();
      showToast('Logged in successfully (Demo Mode)', 'success');
    }, 400);
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    await showDashboard();
    showToast('Logged in successfully', 'success');
  } catch (err) {
    loginError.textContent = err.message || 'Invalid email or password';
    loginError.style.display = 'block';
  } finally {
    setButtonLoading(loginSubmitBtn, false);
  }
}

async function handleLogout() {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  } else {
    localStorage.removeItem('btt_admin_demo_session');
  }
  currentUser = null;
  showAuth();
  showToast('Logged out successfully', 'info');
}

// ==================== BRANDS LOADING & CRUD ====================
async function loadBrands() {
  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('btt_demo_brands');
    brandsList = stored ? JSON.parse(stored) : [...SEED_BRANDS];
    if (!stored) saveLocalBrands();
    populateBrandDropdowns();
    renderBrandsTable();
    updateStats();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    brandsList = data && data.length > 0 ? data : [...SEED_BRANDS];
    populateBrandDropdowns();
    renderBrandsTable();
    updateStats();
  } catch (err) {
    console.error('Failed to load brands from Supabase:', err);
    brandsList = [...SEED_BRANDS];
    populateBrandDropdowns();
    renderBrandsTable();
    updateStats();
  }
}

function populateBrandDropdowns() {
  // 1. Toolbar Brand Filter Dropdown
  const currentFilterVal = brandFilter.value;
  brandFilter.innerHTML = '<option value="all">All Brands</option>';
  brandsList.forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand.id;
    opt.textContent = brand.name;
    brandFilter.appendChild(opt);
  });
  if (currentFilterVal && brandsList.some(b => b.id === currentFilterVal)) {
    brandFilter.value = currentFilterVal;
  }

  // 2. Project Modal Brand Dropdown
  const currentSelectedBrand = projectBrand.value;
  projectBrand.innerHTML = '<option value="">Select a Brand / Client...</option>';
  brandsList.forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand.id;
    opt.textContent = brand.name;
    projectBrand.appendChild(opt);
  });
  if (currentSelectedBrand && brandsList.some(b => b.id === currentSelectedBrand)) {
    projectBrand.value = currentSelectedBrand;
  }
}

function renderBrandsTable() {
  if (!brandsTableBody) return;
  brandListCount.textContent = brandsList.length;

  if (brandsList.length === 0) {
    brandsTableBody.innerHTML = '';
    brandTableEmpty.style.display = 'block';
    return;
  }

  brandTableEmpty.style.display = 'none';
  brandsTableBody.innerHTML = brandsList.map(brand => {
    const count = getBrandProjectCount(brand.id, brand.name);
    return `
      <tr data-brand-id="${brand.id}">
        <td><strong>#${brand.sort_order || 0}</strong></td>
        <td><strong>${escapeHtml(brand.name)}</strong></td>
        <td><code style="font-size:11px; color:var(--text-muted);">${escapeHtml(brand.slug || '')}</code></td>
        <td>
          <span class="brand-count-badge">${count}</span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit-brand-btn" data-brand-id="${brand.id}" title="Edit Brand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon btn-icon--danger delete-brand-btn" data-brand-id="${brand.id}" title="Delete Brand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach brand table action listeners
  brandsTableBody.querySelectorAll('.edit-brand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-brand-id');
      openEditBrand(id);
    });
  });

  brandsTableBody.querySelectorAll('.delete-brand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-brand-id');
      openDeleteBrandModal(id);
    });
  });
}

function getBrandProjectCount(brandId, brandName) {
  return projectsList.filter(p => p.brand_id === brandId || (brandName && p.client === brandName)).length;
}

function openBrandModal() {
  resetBrandForm();
  renderBrandsTable();
  brandModal.classList.add('active');
  brandModal.setAttribute('aria-hidden', 'false');
}

function closeBrandModal() {
  brandModal.classList.remove('active');
  brandModal.setAttribute('aria-hidden', 'true');
  resetBrandForm();
}

function resetBrandForm() {
  brandForm.reset();
  brandEditId.value = '';
  brandFormTitle.textContent = 'Add New Brand';
  brandSortOrderInput.value = brandsList.length + 1;
  brandFormResetBtn.style.display = 'none';
  brandFormError.style.display = 'none';
}

function openEditBrand(id) {
  const brand = brandsList.find(b => b.id === id);
  if (!brand) return;

  brandEditId.value = brand.id;
  brandNameInput.value = brand.name;
  brandSlugInput.value = brand.slug || '';
  brandSortOrderInput.value = brand.sort_order || 1;
  brandFormTitle.textContent = `Edit Brand: ${brand.name}`;
  brandFormResetBtn.style.display = 'inline-block';
  brandNameInput.focus();
}

async function handleBrandSubmit(e) {
  e.preventDefault();
  brandFormError.style.display = 'none';
  setButtonLoading(saveBrandBtn, true);

  const id = brandEditId.value;
  const name = brandNameInput.value.trim();
  const slug = (brandSlugInput.value.trim() || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const sortOrder = parseInt(brandSortOrderInput.value, 10) || 1;

  if (!name) {
    brandFormError.textContent = 'Brand name is required';
    brandFormError.style.display = 'block';
    setButtonLoading(saveBrandBtn, false);
    return;
  }

  const payload = { name, slug, sort_order: sortOrder };

  try {
    if (!isSupabaseConfigured()) {
      if (id) {
        const index = brandsList.findIndex(b => b.id === id);
        if (index !== -1) {
          const oldName = brandsList[index].name;
          brandsList[index] = { ...brandsList[index], ...payload };
          // Cascade client name updates to projects in demo mode
          projectsList.forEach(p => {
            if (p.brand_id === id || p.client === oldName) {
              p.client = name;
              p.brand_id = id;
            }
          });
          saveLocalProjects();
        }
      } else {
        const newBrand = {
          id: `b_${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString()
        };
        brandsList.push(newBrand);
      }
      saveLocalBrands();
      resetBrandForm();
      populateBrandDropdowns();
      renderBrandsTable();
      renderProjectsTable();
      updateStats();
      showToast(id ? 'Brand updated' : 'Brand created', 'success');
      return;
    }

    // Supabase Save
    if (id) {
      const { error } = await supabase
        .from('brands')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('brands')
        .insert([payload]);
      if (error) throw error;
    }

    resetBrandForm();
    await loadBrands();
    await loadProjects();
    showToast(id ? 'Brand updated successfully' : 'Brand created successfully', 'success');
  } catch (err) {
    console.error('Error saving brand:', err);
    brandFormError.textContent = err.message || 'Error saving brand';
    brandFormError.style.display = 'block';
  } finally {
    setButtonLoading(saveBrandBtn, false);
  }
}

function openDeleteBrandModal(id) {
  const brand = brandsList.find(b => b.id === id);
  if (!brand) return;

  deleteBrandTargetId = id;
  deleteBrandName.textContent = brand.name;

  const count = getBrandProjectCount(brand.id, brand.name);
  if (count > 0) {
    // Brand is in use!
    brandDeleteWarningWrap.style.display = 'block';
    brandDeleteConfirmWrap.style.display = 'none';
    brandInUseMsg.textContent = `This brand is currently linked to ${count} project${count > 1 ? 's' : ''}. To preserve portfolio integrity, brands in use cannot be deleted.`;
    deleteBrandConfirmBtn.disabled = true;
    deleteBrandConfirmBtn.style.display = 'none';
  } else {
    brandDeleteWarningWrap.style.display = 'none';
    brandDeleteConfirmWrap.style.display = 'block';
    deleteBrandConfirmBtn.disabled = false;
    deleteBrandConfirmBtn.style.display = 'inline-block';
  }

  deleteBrandModal.classList.add('active');
  deleteBrandModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteBrandModal() {
  deleteBrandModal.classList.remove('active');
  deleteBrandModal.setAttribute('aria-hidden', 'true');
  deleteBrandTargetId = null;
}

async function confirmDeleteBrand() {
  if (!deleteBrandTargetId) return;
  setButtonLoading(deleteBrandConfirmBtn, true, 'Deleting...');

  try {
    if (!isSupabaseConfigured()) {
      brandsList = brandsList.filter(b => b.id !== deleteBrandTargetId);
      saveLocalBrands();
      closeDeleteBrandModal();
      populateBrandDropdowns();
      renderBrandsTable();
      updateStats();
      showToast('Brand deleted successfully', 'success');
      return;
    }

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', deleteBrandTargetId);

    if (error) throw error;

    closeDeleteBrandModal();
    await loadBrands();
    showToast('Brand deleted successfully', 'success');
  } catch (err) {
    console.error('Error deleting brand:', err);
    showToast('Failed to delete brand: ' + (err.message || 'Error'), 'error');
  } finally {
    setButtonLoading(deleteBrandConfirmBtn, false, 'Delete Brand');
  }
}

function saveLocalBrands() {
  localStorage.setItem('btt_demo_brands', JSON.stringify(brandsList));
}

// ==================== PROJECT LOADING ====================
async function loadProjects() {
  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('btt_demo_projects');
    const loaded = stored ? JSON.parse(stored) : [...SEED_PROJECTS];
    projectsList = sanitizeProjectList(loaded);
    saveLocalProjects(); // Persist healed paths to localStorage
    // Reconcile missing brand_ids from client names
    reconcileProjectBrands();
    projectsList.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
    renderProjectsTable();
    updateStats();
    return;
  }

  try {
    const { data: projects, error } = await supabase
      .from('portfolio_projects')
      .select(`
        *,
        brands (
          id, name, slug
        ),
        portfolio_media (
          id, type, url, sort_order
        )
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    projectsList = projects || [];
    reconcileProjectBrands();
    projectsList.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
    renderProjectsTable();
    updateStats();
  } catch (err) {
    console.error('Failed to load projects from Supabase:', err);
    showToast('Falling back to local projects cache', 'error');
    projectsList = [...SEED_PROJECTS];
    reconcileProjectBrands();
    projectsList.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
    renderProjectsTable();
    updateStats();
  }
}

function reconcileProjectBrands() {
  projectsList.forEach(p => {
    if (!p.brand_id && p.client) {
      const match = brandsList.find(b => b.name.toLowerCase() === p.client.toLowerCase());
      if (match) {
        p.brand_id = match.id;
      }
    }
  });
}

function updateStats() {
  const total = projectsList.length;
  const published = projectsList.filter(p => p.published).length;
  const drafts = total - published;

  statTotal.textContent = total;
  statBrands.textContent = brandsList.length;
  statPublished.textContent = published;
  statDrafts.textContent = drafts;
}

// ==================== TABLE RENDERING ====================
function renderProjectsTable() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedBrandId = brandFilter.value;
  const categoryVal = categoryFilter.value;
  const statusVal = statusFilter.value;

  const filtered = projectsList.filter(p => {
    // Resolve brand name
    const brandObj = brandsList.find(b => b.id === p.brand_id) || p.brands;
    const brandName = brandObj ? brandObj.name : (p.client || '');

    // Search query filter (Project title, Brand name, Client name, descriptions, tags)
    const matchQuery = !query || 
      p.title.toLowerCase().includes(query) ||
      brandName.toLowerCase().includes(query) ||
      (p.client && p.client.toLowerCase().includes(query)) ||
      (p.category_label && p.category_label.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.performance_badge && p.performance_badge.toLowerCase().includes(query));

    // Brand filter
    const matchBrand = selectedBrandId === 'all' || 
      p.brand_id === selectedBrandId || 
      (brandObj && brandObj.id === selectedBrandId);

    // Category filter
    const matchCategory = categoryVal === 'all' || p.category === categoryVal;

    // Status filter
    const matchStatus = statusVal === 'all' ||
      (statusVal === 'published' && p.published) ||
      (statusVal === 'draft' && !p.published);

    return matchQuery && matchBrand && matchCategory && matchStatus;
  });

  if (filtered.length === 0) {
    projectsTableBody.innerHTML = '';
    tableEmpty.style.display = 'block';
    return;
  }

  tableEmpty.style.display = 'none';
  projectsTableBody.innerHTML = filtered.map(project => {
    const brandObj = brandsList.find(b => b.id === project.brand_id) || project.brands;
    const displayBrandName = brandObj ? brandObj.name : (project.client || '—');

    const mediaBadgeClass = project.media_type === 'video' ? 'badge--video' :
                           project.media_type === 'gallery' ? 'badge--gallery' : 'badge--image';
    const mediaIcon = project.media_type === 'video' ? '🎬 Video' :
                      project.media_type === 'gallery' ? '🖼️ Gallery' : '📷 Image';

    const rawThumb = project.thumbnail_url || 
                     (project.media_type === 'video' ? '/assets/mg_jewellers.jpg' : '/assets/img_1.png');
    const thumbSrc = normalizeAssetUrl(rawThumb);

    return `
      <tr data-id="${project.id}">
        <td><strong>#${project.sort_order || 0}</strong></td>
        <td>
          <img src="${thumbSrc}" alt="${project.title}" class="thumb-cell-img" onerror="this.src='/assets/img_1.png'" />
        </td>
        <td>
          <div class="project-meta-cell">
            <span class="project-meta-title">${escapeHtml(project.title)}</span>
          </div>
        </td>
        <td>
          <span class="brand-badge">${escapeHtml(displayBrandName)}</span>
        </td>
        <td>
          <span class="badge badge--pill">${escapeHtml(project.category_label || getDefaultCategoryLabel(project.category))}</span>
        </td>
        <td>
          <span class="badge ${mediaBadgeClass}">${mediaIcon}</span>
        </td>
        <td>
          ${project.performance_badge ? `<span class="badge badge--metric">${escapeHtml(project.performance_badge)}</span>` : '<span style="color:var(--text-subtle);">—</span>'}
        </td>
        <td>
          <label class="toggle-switch" title="Toggle Featured">
            <input type="checkbox" class="featured-toggle" data-id="${project.id}" ${project.featured ? 'checked' : ''} />
            <span class="toggle-switch__slider"></span>
          </label>
        </td>
        <td>
          <label class="toggle-switch" title="Toggle Published">
            <input type="checkbox" class="published-toggle" data-id="${project.id}" ${project.published ? 'checked' : ''} />
            <span class="toggle-switch__slider"></span>
          </label>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit-btn" data-id="${project.id}" title="Edit Project">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon btn-icon--danger delete-btn" data-id="${project.id}" title="Delete Project">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attachTableEventListeners();
}

function attachTableEventListeners() {
  // Published Toggles
  document.querySelectorAll('.published-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isPublished = e.target.checked;
      await updateProjectField(id, { published: isPublished });
      showToast(isPublished ? 'Project published live' : 'Project moved to draft', 'info');
    });
  });

  // Featured Toggles
  document.querySelectorAll('.featured-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const isFeatured = e.target.checked;
      await updateProjectField(id, { featured: isFeatured });
      showToast(isFeatured ? 'Project marked as featured' : 'Project removed from featured', 'info');
    });
  });

  // Edit Buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openEditModal(id);
    });
  });

  // Delete Buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openDeleteModal(id);
    });
  });
}

// ==================== FAST FIELD UPDATES ====================
async function updateProjectField(id, updates) {
  const project = projectsList.find(p => p.id === id);
  if (project) Object.assign(project, updates);

  if (!isSupabaseConfigured()) {
    saveLocalProjects();
    updateStats();
    return;
  }

  try {
    const { error } = await supabase
      .from('portfolio_projects')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    updateStats();
  } catch (err) {
    console.error('Failed to update project field:', err);
    showToast('Failed to sync change with database', 'error');
  }
}

// ==================== PROJECT MODAL / FORM MANAGEMENT ====================
function openAddModal() {
  projectForm.reset();
  projectIdInput.value = '';
  modalTitle.textContent = 'Add New Project';
  modalAlert.style.display = 'none';

  // Populate brand dropdown with fresh list
  populateBrandDropdowns();
  if (brandsList.length > 0) {
    projectBrand.value = brandsList[0].id;
    projectClient.value = brandsList[0].name;
  }

  // Default values
  projectSortOrder.value = projectsList.length + 1;
  projectPublished.checked = true;
  projectFeatured.checked = false;
  const videoRadio = document.getElementById('mediaTypeVideo');
  if (videoRadio) videoRadio.checked = true;
  updateMediaTypeFields('video');

  clearMediaPreviews();
  selectedGalleryFiles = [];
  existingGalleryItems = [];
  renderGalleryStrip();

  projectModal.classList.add('active');
  projectModal.setAttribute('aria-hidden', 'false');
}

function openEditModal(id) {
  const project = projectsList.find(p => p.id === id);
  if (!project) return;

  projectForm.reset();
  modalAlert.style.display = 'none';
  modalTitle.textContent = `Edit Project: ${project.title}`;
  projectIdInput.value = project.id;

  populateBrandDropdowns();

  // Set Brand
  let targetBrandId = project.brand_id;
  if (!targetBrandId && project.client) {
    const matchedBrand = brandsList.find(b => b.name.toLowerCase() === project.client.toLowerCase());
    if (matchedBrand) targetBrandId = matchedBrand.id;
  }
  projectBrand.value = targetBrandId || (brandsList[0] ? brandsList[0].id : '');
  projectClient.value = project.client || '';

  projectTitle.value = project.title || '';
  projectCategory.value = project.category || 'branding';
  projectCategoryLabel.value = project.category_label || '';
  projectBadge.value = project.performance_badge || '';
  projectSortOrder.value = project.sort_order || 1;
  projectDesc.value = project.description || '';
  projectDetailedDesc.value = project.detailed_description || '';
  projectPublished.checked = Boolean(project.published);
  projectFeatured.checked = Boolean(project.featured);

  // Set Media Type
  const type = project.media_type || 'image';
  const radio = document.querySelector(`input[name="mediaType"][value="${type}"]`);
  if (radio) radio.checked = true;
  updateMediaTypeFields(type);

  // Thumbnail preview
  clearMediaPreviews();
  if (project.thumbnail_url) {
    projectThumbnailUrl.value = project.thumbnail_url;
    thumbnailPreviewImg.src = normalizeAssetUrl(project.thumbnail_url);
    thumbnailPreviewWrap.style.display = 'inline-block';
    thumbnailPlaceholder.style.display = 'none';
  }

  // Video preview
  if (project.media_url && project.media_type === 'video') {
    projectVideoUrl.value = project.media_url;
    videoPreviewEl.src = normalizeAssetUrl(project.media_url);
    videoPreviewWrap.style.display = 'inline-block';
    videoPlaceholder.style.display = 'none';
  }

  // Gallery items
  existingGalleryItems = project.portfolio_media || project.gallery || [];
  selectedGalleryFiles = [];
  renderGalleryStrip();

  projectModal.classList.add('active');
  projectModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  projectModal.classList.remove('active');
  projectModal.setAttribute('aria-hidden', 'true');
}

function updateMediaTypeFields(type) {
  if (type === 'video') {
    videoFieldGroup.style.display = 'block';
    galleryFieldGroup.style.display = 'none';
  } else if (type === 'gallery') {
    videoFieldGroup.style.display = 'none';
    galleryFieldGroup.style.display = 'block';
  } else {
    videoFieldGroup.style.display = 'none';
    galleryFieldGroup.style.display = 'none';
  }
}

function clearMediaPreviews() {
  thumbnailFileInput.value = '';
  thumbnailPreviewWrap.style.display = 'none';
  thumbnailPlaceholder.style.display = 'block';

  videoFileInput.value = '';
  videoPreviewWrap.style.display = 'none';
  videoPlaceholder.style.display = 'block';
}

// ==================== MEDIA UPLOADER LOGIC ====================
async function uploadFileToStorage(file, folder = 'misc') {
  if (!isSupabaseConfigured()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${folder}/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from('portfolio-media')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('portfolio-media')
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

// ==================== FORM SUBMIT (SAVE PROJECT) ====================
async function handleProjectSubmit(e) {
  e.preventDefault();
  modalAlert.style.display = 'none';
  setButtonLoading(saveProjectBtn, true, 'Saving project...');

  try {
    const id = projectIdInput.value || (isSupabaseConfigured() ? undefined : `local_${Date.now()}`);
    const title = projectTitle.value.trim();
    
    // Resolve brand
    const selectedBrandId = projectBrand.value;
    const matchedBrand = brandsList.find(b => b.id === selectedBrandId);
    const client = matchedBrand ? matchedBrand.name : (projectClient.value.trim() || 'Bend The Trend Client');

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = projectCategory.value;
    const categoryLabel = projectCategoryLabel.value.trim() || getDefaultCategoryLabel(category);
    const badge = projectBadge.value.trim();
    const sortOrder = parseInt(projectSortOrder.value, 10) || 1;
    const desc = projectDesc.value.trim();
    const detailedDesc = projectDetailedDesc.value.trim();
    const published = projectPublished.checked;
    const featured = projectFeatured.checked;

    const mediaType = document.querySelector('input[name="mediaType"]:checked')?.value || 'image';

    // 1. Process Thumbnail
    let finalThumbnailUrl = projectThumbnailUrl.value.trim();
    if (thumbnailFileInput.files && thumbnailFileInput.files[0]) {
      setButtonLoading(saveProjectBtn, true, 'Uploading thumbnail...');
      finalThumbnailUrl = await uploadFileToStorage(thumbnailFileInput.files[0], 'thumbnails');
    }

    // 2. Process Video (if video type)
    let finalVideoUrl = projectVideoUrl.value.trim();
    if (mediaType === 'video' && videoFileInput.files && videoFileInput.files[0]) {
      setButtonLoading(saveProjectBtn, true, 'Uploading video reel...');
      finalVideoUrl = await uploadFileToStorage(videoFileInput.files[0], 'videos');
    }

    // 3. Process Gallery Images (if gallery type)
    let finalGalleryUrls = [];
    existingGalleryItems.forEach(item => {
      if (item.url) finalGalleryUrls.push(item.url);
    });
    if (mediaType === 'gallery' && selectedGalleryFiles.length > 0) {
      setButtonLoading(saveProjectBtn, true, 'Uploading gallery images...');
      for (const file of selectedGalleryFiles) {
        const url = await uploadFileToStorage(file, 'galleries');
        finalGalleryUrls.push(url);
      }
    }
    const manualGallery = projectGalleryUrls.value.split(',').map(s => s.trim()).filter(Boolean);
    manualGallery.forEach(u => {
      if (!finalGalleryUrls.includes(u)) finalGalleryUrls.push(u);
    });

    const projectPayload = {
      brand_id: selectedBrandId || null,
      title,
      client,
      slug,
      category,
      category_label: categoryLabel,
      description: desc,
      detailed_description: detailedDesc,
      thumbnail_url: finalThumbnailUrl,
      media_type: mediaType,
      media_url: mediaType === 'video' ? finalVideoUrl : (finalGalleryUrls[0] || finalThumbnailUrl),
      performance_badge: badge,
      featured,
      published,
      sort_order: sortOrder
    };

    if (!isSupabaseConfigured()) {
      // Demo Mode save
      if (projectIdInput.value) {
        const index = projectsList.findIndex(p => p.id === projectIdInput.value);
        if (index !== -1) {
          projectsList[index] = {
            ...projectsList[index],
            ...projectPayload,
            gallery: finalGalleryUrls.map((u, i) => ({ url: u, sort_order: i + 1 }))
          };
        }
      } else {
        projectsList.push({
          id,
          ...projectPayload,
          gallery: finalGalleryUrls.map((u, i) => ({ url: u, sort_order: i + 1 }))
        });
      }
      projectsList.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      saveLocalProjects();
      closeModal();
      renderProjectsTable();
      updateStats();
      showToast('Project saved successfully', 'success');
      return;
    }

    // Supabase Save
    let savedProjectId = id;
    if (id) {
      const { error } = await supabase
        .from('portfolio_projects')
        .update(projectPayload)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .insert([projectPayload])
        .select()
        .single();
      if (error) throw error;
      savedProjectId = data.id;
    }

    // Sync Gallery media if mediaType === 'gallery'
    if (mediaType === 'gallery' && finalGalleryUrls.length > 0) {
      await supabase
        .from('portfolio_media')
        .delete()
        .eq('project_id', savedProjectId);

      const mediaRows = finalGalleryUrls.map((url, index) => ({
        project_id: savedProjectId,
        type: 'image',
        url,
        sort_order: index + 1
      }));

      await supabase.from('portfolio_media').insert(mediaRows);
    }

    closeModal();
    await loadProjects();
    showToast('Project saved successfully', 'success');
  } catch (err) {
    console.error('Error saving project:', err);
    modalAlert.textContent = err.message || 'Error saving project. Please try again.';
    modalAlert.style.display = 'block';
  } finally {
    setButtonLoading(saveProjectBtn, false, 'Save Project');
  }
}

// ==================== DELETE MODAL & ACTION ====================
function openDeleteModal(id) {
  const project = projectsList.find(p => p.id === id);
  if (!project) return;

  deleteTargetId = id;
  deleteProjectTitle.textContent = `"${project.title}" (${project.client})`;
  deleteModal.classList.add('active');
  deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  deleteModal.setAttribute('aria-hidden', 'true');
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  setButtonLoading(deleteConfirmBtn, true, 'Deleting...');

  try {
    if (!isSupabaseConfigured()) {
      projectsList = projectsList.filter(p => p.id !== deleteTargetId);
      saveLocalProjects();
      closeDeleteModal();
      renderProjectsTable();
      updateStats();
      showToast('Project deleted successfully', 'success');
      return;
    }

    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', deleteTargetId);

    if (error) throw error;

    closeDeleteModal();
    await loadProjects();
    showToast('Project deleted successfully', 'success');
  } catch (err) {
    console.error('Error deleting project:', err);
    showToast('Failed to delete project: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    setButtonLoading(deleteConfirmBtn, false, 'Delete Permanently');
  }
}

// ==================== GALLERY PREVIEWS ====================
function renderGalleryStrip() {
  galleryPreviewStrip.innerHTML = '';

  existingGalleryItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'gallery-thumb-item';
    div.innerHTML = `
      <img src="${normalizeAssetUrl(item.url)}" alt="Gallery item" />
      <button type="button" class="gallery-thumb-remove" data-index="${index}" title="Remove image">✕</button>
    `;
    div.querySelector('.gallery-thumb-remove').addEventListener('click', () => {
      existingGalleryItems.splice(index, 1);
      renderGalleryStrip();
    });
    galleryPreviewStrip.appendChild(div);
  });

  selectedGalleryFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'gallery-thumb-item';
    const tempUrl = URL.createObjectURL(file);
    div.innerHTML = `
      <img src="${tempUrl}" alt="${file.name}" />
      <button type="button" class="gallery-thumb-remove" data-file-index="${index}" title="Remove file">✕</button>
    `;
    div.querySelector('.gallery-thumb-remove').addEventListener('click', () => {
      selectedGalleryFiles.splice(index, 1);
      renderGalleryStrip();
    });
    galleryPreviewStrip.appendChild(div);
  });
}

// ==================== HELPERS & EVENT LISTENERS ====================
function initEventListeners() {
  // Login form & Quick Demo Login
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  const quickDemoLoginBtn = document.getElementById('quickDemoLoginBtn');
  if (quickDemoLoginBtn) {
    quickDemoLoginBtn.addEventListener('click', async () => {
      localStorage.setItem('btt_admin_demo_session', JSON.stringify({ email: 'admin@bendthetrend.com' }));
      currentUser = { email: 'admin@bendthetrend.com' };
      await showDashboard();
      showToast('Welcome to Demo Dashboard! (All edits saved locally)', 'success');
    });
  }

  // Search & Filters
  searchInput.addEventListener('input', renderProjectsTable);
  brandFilter.addEventListener('change', renderProjectsTable);
  categoryFilter.addEventListener('change', renderProjectsTable);
  statusFilter.addEventListener('change', renderProjectsTable);

  const resetDemoDataBtn = document.getElementById('resetDemoDataBtn');
  if (resetDemoDataBtn) {
    resetDemoDataBtn.addEventListener('click', () => {
      localStorage.removeItem('btt_demo_projects');
      localStorage.removeItem('btt_demo_brands');
      loadBrands();
      loadProjects();
      showToast('Demo data reset to clean factory defaults!', 'success');
    });
  }

  // Project Modal actions
  addProjectBtn.addEventListener('click', openAddModal);
  emptyAddBtn.addEventListener('click', openAddModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeModal);
  if (projectBrand) {
    projectBrand.addEventListener('change', (e) => {
      const selected = brandsList.find(b => b.id === e.target.value);
      if (selected && projectClient) {
        projectClient.value = selected.name;
      }
    });
  }
  projectForm.addEventListener('submit', handleProjectSubmit);

  // Brand Modal actions
  if (manageBrandsBtn) manageBrandsBtn.addEventListener('click', openBrandModal);
  if (headerManageBrandsBtn) headerManageBrandsBtn.addEventListener('click', openBrandModal);
  if (inlineAddBrandBtn) inlineAddBrandBtn.addEventListener('click', openBrandModal);
  if (brandModalCloseBtn) brandModalCloseBtn.addEventListener('click', closeBrandModal);
  if (brandModalDoneBtn) brandModalDoneBtn.addEventListener('click', closeBrandModal);
  if (brandModalBackdrop) brandModalBackdrop.addEventListener('click', closeBrandModal);
  if (brandForm) brandForm.addEventListener('submit', handleBrandSubmit);
  if (brandFormResetBtn) brandFormResetBtn.addEventListener('click', resetBrandForm);

  // Brand Delete Modal
  if (deleteBrandModalCloseBtn) deleteBrandModalCloseBtn.addEventListener('click', closeDeleteBrandModal);
  if (deleteBrandCancelBtn) deleteBrandCancelBtn.addEventListener('click', closeDeleteBrandModal);
  if (deleteBrandModalBackdrop) deleteBrandModalBackdrop.addEventListener('click', closeDeleteBrandModal);
  if (deleteBrandConfirmBtn) deleteBrandConfirmBtn.addEventListener('click', confirmDeleteBrand);

  // Delete Project modal actions
  deleteModalCloseBtn.addEventListener('click', closeDeleteModal);
  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  if (deleteModalBackdrop) deleteModalBackdrop.addEventListener('click', closeDeleteModal);
  deleteConfirmBtn.addEventListener('click', confirmDelete);

  // Media type switcher
  mediaTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateMediaTypeFields(e.target.value);
    });
  });

  // Thumbnail file change
  thumbnailFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      thumbnailPreviewImg.src = URL.createObjectURL(file);
      thumbnailPreviewWrap.style.display = 'inline-block';
      thumbnailPlaceholder.style.display = 'none';
    }
  });

  removeThumbnailBtn.addEventListener('click', () => {
    thumbnailFileInput.value = '';
    projectThumbnailUrl.value = '';
    thumbnailPreviewWrap.style.display = 'none';
    thumbnailPlaceholder.style.display = 'block';
  });

  // Video file change
  videoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      videoPreviewEl.src = URL.createObjectURL(file);
      videoPreviewWrap.style.display = 'inline-block';
      videoPlaceholder.style.display = 'none';
    }
  });

  removeVideoBtn.addEventListener('click', () => {
    videoFileInput.value = '';
    projectVideoUrl.value = '';
    videoPreviewWrap.style.display = 'none';
    videoPlaceholder.style.display = 'block';
  });

  // Gallery file change
  galleryFileInput.addEventListener('change', (e) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(f => selectedGalleryFiles.push(f));
      renderGalleryStrip();
    }
  });

  // Escape key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (projectModal.classList.contains('active')) closeModal();
      if (brandModal.classList.contains('active')) closeBrandModal();
      if (deleteBrandModal.classList.contains('active')) closeDeleteBrandModal();
      if (deleteModal.classList.contains('active')) closeDeleteModal();
    }
  });
}

function getDefaultCategoryLabel(category) {
  const map = {
    video: 'Reels & Video',
    branding: 'Branding & Web',
    social: 'Social Campaigns',
    ads: 'Performance Ads',
    healthcare: 'Healthcare & Dental'
  };
  return map[category] || category;
}

function saveLocalProjects() {
  localStorage.setItem('btt_demo_projects', JSON.stringify(projectsList));
}

function setButtonLoading(btn, isLoading, text) {
  const textSpan = btn.querySelector('.btn__text');
  const spinner = btn.querySelector('.btn__spinner');
  btn.disabled = isLoading;
  if (text && textSpan) textSpan.textContent = text;
  if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
}

function showToast(message, type = 'info') {
  if (!adminToast) return;
  adminToast.textContent = message;
  adminToast.className = `toast show toast--${type}`;
  setTimeout(() => {
    if (adminToast) adminToast.classList.remove('show');
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function normalizeAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/')) return url;
  return '/' + url;
}

function sanitizeProjectList(list) {
  if (!Array.isArray(list)) return [...SEED_PROJECTS];
  return list.map(p => {
    let thumb = p.thumbnail_url || '';
    if (!thumb || thumb.includes('pulse_fitness') || !thumb.startsWith('/')) {
      const client = (p.client || '').toLowerCase();
      if (client.includes('jewel')) thumb = '/assets/mg_jewellers.jpg';
      else if (client.includes('sofa')) thumb = '/assets/indian_sofa_company.jpg';
      else if (client.includes('dental')) thumb = '/assets/Arihant Dental care/photo_2026-08-21_19-29-23.jpg';
      else if (client.includes('pulse')) thumb = '/assets/img_25.png';
      else thumb = p.media_type === 'video' ? '/assets/mg_jewellers.jpg' : '/assets/img_1.png';
    }
    p.thumbnail_url = normalizeAssetUrl(thumb);
    if (p.media_url) p.media_url = normalizeAssetUrl(p.media_url);
    return p;
  });
}
