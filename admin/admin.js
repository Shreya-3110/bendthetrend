import { supabase, isSupabaseConfigured, SEED_PROJECTS } from '../supabaseClient.js';

// ==================== STATE ====================
let currentUser = null;
let projectsList = [];
let deleteTargetId = null;
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
const statPublished = document.getElementById('statPublished');
const statDrafts = document.getElementById('statDrafts');
const statCategories = document.getElementById('statCategories');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const projectsTableBody = document.getElementById('projectsTableBody');
const tableEmpty = document.getElementById('tableEmpty');
const addProjectBtn = document.getElementById('addProjectBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');

// Project Modal elements
const projectModal = document.getElementById('projectModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const projectForm = document.getElementById('projectForm');
const modalTitle = document.getElementById('modalTitle');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const modalAlert = document.getElementById('modalAlert');

// Form inputs
const projectIdInput = document.getElementById('projectId');
const projectTitle = document.getElementById('projectTitle');
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

// Delete modal
const deleteModal = document.getElementById('deleteModal');
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
  if (!isSupabaseConfigured()) {
    configAlert.style.display = 'block';
    configAlert.innerHTML = `
      <strong>Demo Mode Active:</strong> Supabase credentials are not yet configured in <code>.env</code>. 
      Follow the <code>.env.example</code> guide and run <code>supabase-schema.sql</code> in your Supabase SQL editor.
      For local review, you can test project management with in-memory persistence.
    `;
  }
}

// ==================== AUTHENTICATION ====================
async function checkAuthSession() {
  if (!isSupabaseConfigured()) {
    // Check local demo session
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

function showDashboard() {
  authSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  headerActions.style.display = 'flex';
  userEmailDisplay.textContent = currentUser?.email || 'admin@bendthetrend.com';
  loadProjects();
}

async function handleLogin(e) {
  e.preventDefault();
  loginError.style.display = 'none';
  setButtonLoading(loginSubmitBtn, true);

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!isSupabaseConfigured()) {
    // Demo mode: accept any valid password or standard credentials
    setTimeout(() => {
      localStorage.setItem('btt_admin_demo_session', JSON.stringify({ email }));
      currentUser = { email };
      setButtonLoading(loginSubmitBtn, false);
      showDashboard();
      showToast('Logged in successfully (Demo Mode)', 'success');
    }, 400);
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    showDashboard();
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

// ==================== PROJECT LOADING ====================
async function loadProjects() {
  if (!isSupabaseConfigured()) {
    // Load from local storage or fallback to SEED_PROJECTS
    const stored = localStorage.getItem('btt_demo_projects');
    projectsList = stored ? JSON.parse(stored) : [...SEED_PROJECTS];
    renderProjectsTable();
    updateStats();
    return;
  }

  try {
    const { data: projects, error } = await supabase
      .from('portfolio_projects')
      .select(`
        *,
        portfolio_media (
          id, type, url, sort_order
        )
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    projectsList = projects || [];
    renderProjectsTable();
    updateStats();
  } catch (err) {
    console.error('Failed to load projects:', err);
    showToast('Failed to load projects from Supabase. Falling back to local cache.', 'error');
    projectsList = [...SEED_PROJECTS];
    renderProjectsTable();
    updateStats();
  }
}

function updateStats() {
  const total = projectsList.length;
  const published = projectsList.filter(p => p.published).length;
  const drafts = total - published;

  statTotal.textContent = total;
  statPublished.textContent = published;
  statDrafts.textContent = drafts;
}

// ==================== TABLE RENDERING ====================
function renderProjectsTable() {
  const query = searchInput.value.toLowerCase().trim();
  const categoryVal = categoryFilter.value;
  const statusVal = statusFilter.value;

  const filtered = projectsList.filter(p => {
    // Search query filter
    const matchQuery = !query || 
      p.title.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      (p.category_label && p.category_label.toLowerCase().includes(query)) ||
      (p.performance_badge && p.performance_badge.toLowerCase().includes(query));

    // Category filter
    const matchCategory = categoryVal === 'all' || p.category === categoryVal;

    // Status filter
    const matchStatus = statusVal === 'all' ||
      (statusVal === 'published' && p.published) ||
      (statusVal === 'draft' && !p.published);

    return matchQuery && matchCategory && matchStatus;
  });

  if (filtered.length === 0) {
    projectsTableBody.innerHTML = '';
    tableEmpty.style.display = 'block';
    return;
  }

  tableEmpty.style.display = 'none';
  projectsTableBody.innerHTML = filtered.map(project => {
    const mediaBadgeClass = project.media_type === 'video' ? 'badge--video' :
                           project.media_type === 'gallery' ? 'badge--gallery' : 'badge--image';
    const mediaIcon = project.media_type === 'video' ? '🎬 Video' :
                      project.media_type === 'gallery' ? '🖼️ Gallery' : '📷 Image';

    const thumbSrc = project.thumbnail_url || 
                     (project.media_type === 'video' ? '/assets/mg_jewellers.jpg' : '/assets/img_1.png');

    return `
      <tr data-id="${project.id}">
        <td><strong>#${project.sort_order || 0}</strong></td>
        <td>
          <img src="${thumbSrc}" alt="${project.title}" class="thumb-cell-img" onerror="this.src='/assets/img_1.png'" />
        </td>
        <td>
          <div class="project-meta-cell">
            <span class="project-meta-title">${escapeHtml(project.title)}</span>
            <span class="project-meta-client">${escapeHtml(project.client)}</span>
          </div>
        </td>
        <td>
          <span class="badge badge--pill">${escapeHtml(project.category_label || project.category)}</span>
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

  // Bind table action listeners
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

// ==================== MODAL / FORM MANAGEMENT ====================
function openAddModal() {
  projectForm.reset();
  projectIdInput.value = '';
  modalTitle.textContent = 'Add New Project';
  modalAlert.style.display = 'none';

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

  projectTitle.value = project.title || '';
  projectClient.value = project.client || '';
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
    thumbnailPreviewImg.src = project.thumbnail_url;
    thumbnailPreviewWrap.style.display = 'inline-block';
    thumbnailPlaceholder.style.display = 'none';
  }

  // Video preview
  if (project.media_url && project.media_type === 'video') {
    projectVideoUrl.value = project.media_url;
    videoPreviewEl.src = project.media_url;
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
    // In demo mode, convert to base64 Data URL so it persists across refreshes in localStorage
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
    const client = projectClient.value.trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = projectCategory.value;
    const categoryLabel = projectCategoryLabel.value.trim() || getDefaultCategoryLabel(category);
    const badge = projectBadge.value.trim();
    const sortOrder = parseInt(projectSortOrder.value, 10) || 1;
    const desc = projectDesc.value.trim();
    const detailedDesc = projectDetailedDesc.value.trim();
    const published = projectPublished.checked;
    const featured = projectFeatured.checked;

    const mediaType = document.querySelector('input[name="mediaType"]:checked').value;

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
    // Keep existing items
    existingGalleryItems.forEach(item => {
      if (item.url) finalGalleryUrls.push(item.url);
    });
    // Upload newly added files
    if (mediaType === 'gallery' && selectedGalleryFiles.length > 0) {
      setButtonLoading(saveProjectBtn, true, 'Uploading gallery images...');
      for (const file of selectedGalleryFiles) {
        const url = await uploadFileToStorage(file, 'galleries');
        finalGalleryUrls.push(url);
      }
    }
    // Check manual comma input
    const manualGallery = projectGalleryUrls.value.split(',').map(s => s.trim()).filter(Boolean);
    manualGallery.forEach(u => {
      if (!finalGalleryUrls.includes(u)) finalGalleryUrls.push(u);
    });

    const projectPayload = {
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
        projectsList.unshift({
          id,
          ...projectPayload,
          gallery: finalGalleryUrls.map((u, i) => ({ url: u, sort_order: i + 1 }))
        });
      }
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
      // Update
      const { error } = await supabase
        .from('portfolio_projects')
        .update(projectPayload)
        .eq('id', id);
      if (error) throw error;
    } else {
      // Insert
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

    // Supabase delete
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
      <img src="${item.url}" alt="Gallery item" />
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
  // Login form
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  // Search & Filters
  searchInput.addEventListener('input', renderProjectsTable);
  categoryFilter.addEventListener('change', renderProjectsTable);
  statusFilter.addEventListener('change', renderProjectsTable);

  // Modal actions
  addProjectBtn.addEventListener('click', openAddModal);
  emptyAddBtn.addEventListener('click', openAddModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  projectForm.addEventListener('submit', handleProjectSubmit);

  // Delete modal actions
  deleteModalCloseBtn.addEventListener('click', closeDeleteModal);
  deleteCancelBtn.addEventListener('click', closeDeleteModal);
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
  adminToast.textContent = message;
  adminToast.className = `toast show toast--${type}`;
  setTimeout(() => {
    adminToast.classList.remove('show');
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
