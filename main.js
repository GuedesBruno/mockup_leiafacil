document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const screenCache = new Map(); // Cache para evitar recarregar arquivos

    // Listener global para fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        const userDropdowns = document.querySelectorAll('.user-list-dropdown');
        userDropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });

    // --- Gerenciamento de Estado ---
    let appState = {
        activeProfile: 'padrao',
        activeUserName: null, // Armazena o nome do usuário ativo
        untitledCounter: 1,
        startCreateProfileFlow: false,
        docState: {
            viewMode: 'text', // 'text' or 'image'
            contrastIndex: 0,
            contrastImageIndex: 0,
        },
        contrastTextClasses: ['', 'contrast-1', 'contrast-2', 'contrast-3', 'contrast-4'],
        contrastImageClasses: ['', 'contrast-img-invert', 'contrast-img-grayscale'],
    };

    const applyProfile = (profileName) => {
        appState.activeProfile = profileName;
        document.body.className = ''; // Limpa perfis anteriores
        document.body.classList.add(`profile-${profileName}`);
    };

    // Função para carregar e injetar uma tela
    const loadScreen = async (screenName) => {
        // Adiciona uma classe para o efeito de fade-out
        appRoot.classList.add('fade-out');

        try {
            let html = '';
            if (screenCache.has(screenName)) {
                html = screenCache.get(screenName);
            } else {
                const response = await fetch(`${screenName}.html`);
                if (!response.ok) throw new Error(`Tela não encontrada: ${screenName}`);
                html = await response.text();
                screenCache.set(screenName, html);
            }
            
            // Espera a animação de fade-out terminar antes de trocar o conteúdo
            setTimeout(() => {
                appRoot.innerHTML = html;
                appRoot.classList.remove('fade-out'); // Remove para o fade-in
                bindScreenEvents(screenName);
            }, 200); // Duração deve ser igual à transição no CSS

        } catch (error) {
            console.error('Erro ao carregar tela:', error);
            appRoot.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar o conteúdo.</p>`;
            appRoot.classList.remove('fade-out');
        }
    };

    // Adiciona os event listeners para a tela recém-carregada
    const bindScreenEvents = (screenName) => {
        // Eventos globais para o Header que agora existe em múltiplas telas
        document.querySelectorAll('.btn-close-app, .btn-close-app-bottom').forEach(btn => {
            btn.addEventListener('click', () => alert('Mockup: Fechar aplicativo'));
        });

        // Atualiza o nome do usuário no Header se estiver setado
        if (appState.activeUserName) {
            document.querySelectorAll('#btn-user-header span').forEach(span => span.innerText = appState.activeUserName);
        } else {
            document.querySelectorAll('#btn-user-header span').forEach(span => span.innerText = 'Usuários');
        }

        // --- Lógica Global do Menu de Usuários ---
        const globalUserDropdown = document.getElementById('global-user-dropdown');
        document.querySelectorAll('#btn-user-header, #btn-home-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = btn.getBoundingClientRect();
                let leftPos = rect.left + (rect.width / 2);
                const dropdownEstimatedHeight = 300;
                const spacing = 10;
                
                // Evita que o menu vaze pela direita da tela se o botão estiver no header (canto direito)
                if (leftPos + 140 > window.innerWidth) {
                    leftPos = window.innerWidth - 150;
                }

                // Evita que o menu vaze pela esquerda
                if (leftPos - 140 < 10) {
                    leftPos = 150;
                }

                const spaceBelow = window.innerHeight - rect.bottom;
                const openUpwards = spaceBelow < dropdownEstimatedHeight;

                let topPos;
                if (openUpwards) {
                    topPos = Math.max(10, rect.top - dropdownEstimatedHeight - spacing);
                } else {
                    topPos = rect.bottom + spacing;
                }
                
                globalUserDropdown.style.top = `${topPos}px`;
                globalUserDropdown.style.left = `${leftPos}px`;
                globalUserDropdown.classList.toggle('show');
            });
        });

        if (globalUserDropdown && !globalUserDropdown.dataset.initialized) {
            globalUserDropdown.dataset.initialized = 'true'; // Evita duplicar eventos
            globalUserDropdown.querySelectorAll('.user-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const userName = e.currentTarget.innerText;
                    
                    appState.activeUserName = userName;
                    appState.activeProfile = 'user'; // Define usuário como perfil ativo

                    applyProfile('user'); // Aplica o perfil do usuário

                    // Atualiza o botão da Home (se estiver na tela)
                    const btnUsuario = document.getElementById('btn-home-usuario');
                    if (btnUsuario) {
                        const label = btnUsuario.querySelector('.btn-preset-label');
                        if (label) label.innerText = userName;
                        document.querySelectorAll('#home-screen .btn-preset').forEach(b => b.classList.remove('active-profile'));
                        btnUsuario.classList.add('active-profile');
                    }

                    // Atualiza o nome do usuário no Header de forma imediata em qualquer tela
                    document.querySelectorAll('#btn-user-header span').forEach(span => span.innerText = userName);

                    globalUserDropdown.classList.remove('show');
                });
            });
        }

        const actions = {
            '_home': () => {
                
                const profileButtons = document.querySelectorAll('#home-screen .btn-preset[data-profile]');
                profileButtons.forEach(button => {
                    // Marca o botão do perfil ativo atualmente
                    if (button.dataset.profile === appState.activeProfile) {
                        button.classList.add('active-profile');
                    }

                    button.addEventListener('click', (e) => {
                        const profile = e.currentTarget.dataset.profile;
                        if (profile) {
                            // Reseta o nome de usuário se clicar em um perfil padrão
                            if (profile !== 'user') {
                                appState.activeUserName = null;
                                const userLabel = document.querySelector('#btn-home-usuario .btn-preset-label');
                                if (userLabel) userLabel.innerText = 'Usuário';
                                
                                document.querySelectorAll('#btn-user-header span').forEach(span => span.innerText = 'Usuários');
                            }

                            profileButtons.forEach(btn => btn.classList.remove('active-profile'));
                            e.currentTarget.classList.add('active-profile');
                            applyProfile(profile);
                            // Redireciona diretamente para o Dashboard após selecionar
                            loadScreen('_dashboard');
                        }
                    });
                });

                // Restaura o nome do usuário ativo ao voltar para a tela inicial
                const btnUsuario = document.getElementById('btn-home-usuario');
                if (btnUsuario && appState.activeUserName) {
                    const label = btnUsuario.querySelector('.btn-preset-label');
                    if (label) label.innerText = appState.activeUserName;
                    if (appState.activeProfile === 'user') {
                        btnUsuario.classList.add('active-profile');
                    }
                }
            },
            '_dashboard': () => {
                document.getElementById('btn-scan')?.addEventListener('click', () => loadScreen('_document'));
                document.getElementById('btn-settings')?.addEventListener('click', () => loadScreen('_settings'));
                document.getElementById('btn-back-to-home')?.addEventListener('click', () => loadScreen('_home'));
            },
            '_document': () => {
                // --- Lógica da Tela de Leitura --- //

                // --- AJUSTES DE LAYOUT DINÂMICO (Página de Leitura) ---
                const docName = `[Sem Título ${appState.untitledCounter}]`;
                const docTitleH2 = document.querySelector('#document-screen h2');
                const headerLogo = document.querySelector('#main-app-layout > header .logo');
                const bottomGrid = document.querySelector('#document-screen .main-actions-grid');

                // 1. Atualiza os títulos e move os botões do header para o rodapé no modo texto
                if (docTitleH2) docTitleH2.innerText = docName;
                if (headerLogo) headerLogo.innerText = docName;

                const docContent = document.getElementById('doc-content-text');
                if (docContent) {
                    docContent.innerHTML = `
                        <p>Este é o conteúdo do documento que foi extraído via OCR. Ele pode ser longo e ter múltiplos parágrafos.</p>
                        <p>A formatação do texto, como tamanho da fonte, cor de fundo e espaçamento, será controlada pelas ferramentas acima e pelo perfil de acessibilidade selecionado na tela inicial.</p>
                    `;
                }

                function toggleImageViewMode() {
                    const screen = document.getElementById('document-screen');
                    screen.classList.toggle('image-view-mode');
                
                    const isImageView = screen.classList.contains('image-view-mode');
                    appState.docState.viewMode = isImageView ? 'image' : 'text';
                
                    document.getElementById('doc-content-text')?.classList.toggle('hidden', isImageView);
                    document.getElementById('image-view-container')?.classList.toggle('hidden', !isImageView);
                
                    // --- Lógica de movimentação de elementos ---
                    const header = document.querySelector('header.header-large');
                    const headerLogo = header.querySelector('.logo');
                    
                    // Busca em todo o documento, pois eles podem estar nas Sidebars!
                    const aiToggle = document.querySelector('.ai-toggle-container');
                    const docTools = document.querySelector('.doc-tools');
                
                    const userCloseContainer = document.getElementById('user-close-container');
                    const bottomGrid = document.querySelector('#document-screen .main-actions-grid');
                    const centerWrapper = document.getElementById('doc-center-wrapper');
                    const rightSidebarInner = document.getElementById('sidebar-content-right');
                    const leftSidebarInner = document.getElementById('sidebar-content-left');
                
                
                    if (isImageView) {
                        header.style.display = 'none';
                
                        if (leftSidebarInner) {
                            const sidebarTitle = document.createElement('h2');
                            sidebarTitle.className = 'sidebar-title';
                            sidebarTitle.innerText = headerLogo.innerText;
                            leftSidebarInner.appendChild(sidebarTitle);
                            leftSidebarInner.appendChild(bottomGrid);
                        }
                        if (rightSidebarInner) {
                            rightSidebarInner.appendChild(userCloseContainer); // Move o container com user/close
                            rightSidebarInner.appendChild(aiToggle);
                            rightSidebarInner.appendChild(docTools);
                        }
                    } else { // OCR View
                        header.style.display = 'flex';
                
                        const sidebarTitle = leftSidebarInner?.querySelector('.sidebar-title');
                        if (sidebarTitle) sidebarTitle.remove(); // Remove o título extraído

                        // Move elementos de volta para o header
                        header.appendChild(aiToggle);
                        header.appendChild(docTools);
                        
                        bottomGrid.appendChild(userCloseContainer);
                
                        // Move o bottomGrid de volta para seu container principal
                        if (centerWrapper) centerWrapper.appendChild(bottomGrid);
                    }
                }

                // Ações para recolher as Sidebars no Modo Imagem
                document.getElementById('btn-toggle-left')?.addEventListener('click', () => {
                    const sb = document.getElementById('sidebar-left');
                    sb.classList.toggle('collapsed');
                    document.getElementById('btn-toggle-left').innerText = sb.classList.contains('collapsed') ? '▶' : '◀';
                });
                document.getElementById('btn-toggle-right')?.addEventListener('click', () => {
                    const sb = document.getElementById('sidebar-right');
                    sb.classList.toggle('collapsed');
                    document.getElementById('btn-toggle-right').innerText = sb.classList.contains('collapsed') ? '◀' : '▶';
                });

                // Atribui o evento ao botão principal
                document.getElementById('btn-modo-visualizacao')?.addEventListener('click', toggleImageViewMode);

                
                // 2. Funções dos botões de ferramenta (superiores)
                document.getElementById('btn-leitura-linha')?.addEventListener('click', (e) => {
                    docContent?.classList.toggle('leitura-em-linha-active');
                    // Adiciona marcadores de parágrafo como exemplo
                    if (docContent?.classList.contains('leitura-em-linha-active')) {
                        docContent.innerHTML = `<span class="marcador-paragrafo"></span> <p>Este é o conteúdo do documento que foi extraído via OCR. Ele pode ser longo e ter múltiplos parágrafos.</p> <span class="marcador-paragrafo"></span> <p>A formatação do texto, como tamanho da fonte, cor de fundo e espaçamento, será controlada pelas ferramentas acima e pelo perfil de acessibilidade selecionado na tela inicial.</p>`;
                    } else {
                        docContent.innerHTML = `<p>Este é o conteúdo do documento que foi extraído via OCR. Ele pode ser longo e ter múltiplos parágrafos.</p><p>A formatação do texto, como tamanho da fonte, cor de fundo e espaçamento, será controlada pelas ferramentas acima e pelo perfil de acessibilidade selecionado na tela inicial.</p>`;
                    }
                });

                document.getElementById('btn-contraste')?.addEventListener('click', () => {
                    if (appState.docState.viewMode === 'text') {
                        const docContent = document.getElementById('doc-content-text');
                        if (!docContent) return;
                        appState.contrastTextClasses.forEach(c => { if(c) docContent.classList.remove(c); });
                        appState.docState.contrastIndex = (appState.docState.contrastIndex + 1) % appState.contrastTextClasses.length;
                        const newClass = appState.contrastTextClasses[appState.docState.contrastIndex];
                        if(newClass) docContent.classList.add(newClass);
                    } else { // Modo Imagem
                        const imgContent = document.getElementById('img-a4-preview');
                        if (!imgContent) return;
                        appState.contrastImageClasses.forEach(c => { if(c) imgContent.classList.remove(c); });
                        appState.docState.contrastImageIndex = (appState.docState.contrastImageIndex + 1) % appState.contrastImageClasses.length;
                        const newClass = appState.contrastImageClasses[appState.docState.contrastImageIndex];
                        if(newClass) imgContent.classList.add(newClass);
                    }
                });

                document.getElementById('btn-linha-guia')?.addEventListener('click', () => document.getElementById('linha-guia')?.classList.toggle('hidden'));

                document.getElementById('btn-mascara')?.addEventListener('click', () => {
                    document.getElementById('mascara-top')?.classList.toggle('hidden');
                    document.getElementById('mascara-bottom')?.classList.toggle('hidden');
                });

                const audioBtn = document.getElementById('btn-audio');
                audioBtn?.addEventListener('click', () => {
                    document.getElementById('volume-slider-container')?.classList.toggle('hidden');
                });

                const changeFontSize = (amount) => {
                    const contentEl = document.getElementById('doc-content-text');
                    if (!contentEl) return;
                    // Get the current value of the --doc-size variable from the element's style or from the root
                    let currentSize = parseFloat(contentEl.style.getPropertyValue('--doc-size') || window.getComputedStyle(document.documentElement).getPropertyValue('--doc-size'));
                    currentSize += amount;
                    // Apply the new size directly to the element to override the profile
                    contentEl.style.setProperty('--doc-size', `${currentSize}rem`);
                };
                document.getElementById('btn-zoom-in')?.addEventListener('click', () => changeFontSize(0.1));
                document.getElementById('btn-zoom-out')?.addEventListener('click', () => changeFontSize(-0.1));

                // Lógica para abrir e fechar modais
                const setupModal = (btnId, modalId) => {
                    const modal = document.getElementById(modalId);
                    const openBtn = document.getElementById(btnId);
                    const closeBtn = modal?.querySelector('.btn-close');

                    openBtn?.addEventListener('click', () => modal?.classList.add('show'));
                    closeBtn?.addEventListener('click', () => modal?.classList.remove('show'));
                };

                setupModal('btn-imprimir', 'modal-imprimir');
                document.querySelectorAll('#btn-salvar').forEach(btn => setupModal(btn.id, 'modal-salvar'));
                document.querySelectorAll('#btn-compartilhar').forEach(btn => setupModal(btn.id, 'modal-compartilhar'));

                // Navegação
                document.getElementById('btn-doc-settings')?.addEventListener('click', () => loadScreen('_settings'));
                document.getElementById('btn-doc-voltar')?.addEventListener('click', () => {
                    appState.untitledCounter++; // Incrementa para o próximo documento
                    loadScreen('_dashboard');
                });
            },
            '_settings': () => {
                // Navegação Scroll Lateral
                const sidebarItems = document.querySelectorAll('.settings-sidebar-item');
                const scrollArea = document.getElementById('settings-scroll-area');
                sidebarItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        sidebarItems.forEach(i => i.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                        const targetId = e.currentTarget.dataset.target;
                        const targetEl = document.getElementById(targetId);
                        if(targetEl && scrollArea) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

                            // Fallback para garantir deslocamento no container correto
                            const targetTop = targetEl.getBoundingClientRect().top - scrollArea.getBoundingClientRect().top + scrollArea.scrollTop - 24;
                            scrollArea.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                        }
                    });
                });

                // Troca automática de item ativo no menu ao rolar (Scroll Spy)
                if (scrollArea) {
                    scrollArea.addEventListener('scroll', () => {
                        let currentBlockId = null;
                        const blocks = scrollArea.querySelectorAll('.settings-block');
                        
                        blocks.forEach(block => {
                            // Verifica qual bloco está no topo da área visível (com margem de 50px)
                            if (block.offsetTop - 50 <= scrollArea.scrollTop) {
                                currentBlockId = block.id;
                            }
                        });

                        if (currentBlockId) {
                            sidebarItems.forEach(item => {
                                item.classList.toggle('active', item.dataset.target === currentBlockId);
                            });
                        }
                    });
                }

                // Interações de Formulário
                const toggleVoz = document.getElementById('tgl-voz');
                const audioSub = document.getElementById('audio-sub-options');
                if(toggleVoz && audioSub) toggleVoz.addEventListener('change', (e) => audioSub.classList.toggle('disabled-section', !e.target.checked));

                const toggleRepeticao = document.getElementById('tgl-repeticao');
                const repSub = document.getElementById('repeticao-sub-options');
                if(toggleRepeticao && repSub) toggleRepeticao.addEventListener('change', (e) => repSub.classList.toggle('disabled-section', !e.target.checked));

                const toggleDestaque = document.getElementById('tgl-destaque');
                const destSub = document.getElementById('destaque-sub-options');
                if(toggleDestaque && destSub) toggleDestaque.addEventListener('change', (e) => destSub.classList.toggle('disabled-section', !e.target.checked));

                // Novos toggles para Áudio
                const toggleSilabada = document.getElementById('tgl-leitura-silabada');
                const silabadaSub = document.getElementById('silabada-sub-options');
                if(toggleSilabada && silabadaSub) toggleSilabada.addEventListener('change', (e) => silabadaSub.classList.toggle('disabled-section', !e.target.checked));

                const togglePausaPalavras = document.getElementById('tgl-pausa-palavras');
                const pausaPalavrasSub = document.getElementById('pausa-palavras-sub-options');
                if(togglePausaPalavras && pausaPalavrasSub) togglePausaPalavras.addEventListener('change', (e) => pausaPalavrasSub.classList.toggle('disabled-section', !e.target.checked));

                const togglePausaFrases = document.getElementById('tgl-pausa-frases');
                const pausaFrasesSub = document.getElementById('pausa-frases-sub-options');
                if(togglePausaFrases && pausaFrasesSub) togglePausaFrases.addEventListener('change', (e) => pausaFrasesSub.classList.toggle('disabled-section', !e.target.checked));

                // Toggle para Texto em Bloco
                const toggleTextoBloco = document.getElementById('tgl-texto-bloco');
                const textoBlocoSub = document.getElementById('texto-bloco-sub-options');
                if(toggleTextoBloco && textoBlocoSub) toggleTextoBloco.addEventListener('change', (e) => textoBlocoSub.classList.toggle('disabled-section', !e.target.checked));

                // Velocidade da Voz - Controles
                const inputSpeedVoz = document.getElementById('input-speed-voz');
                const btnSpeedVozMinus = document.getElementById('btn-speed-voz-minus');
                const btnSpeedVozPlus = document.getElementById('btn-speed-voz-plus');
                
                if (btnSpeedVozMinus) btnSpeedVozMinus.addEventListener('click', (e) => {
                    e.preventDefault();
                    const current = parseFloat(inputSpeedVoz.value);
                    const newValue = Math.max(parseFloat(inputSpeedVoz.min), current - 0.1);
                    inputSpeedVoz.value = newValue.toFixed(1);
                });
                
                if (btnSpeedVozPlus) btnSpeedVozPlus.addEventListener('click', (e) => {
                    e.preventDefault();
                    const current = parseFloat(inputSpeedVoz.value);
                    const newValue = Math.min(parseFloat(inputSpeedVoz.max), current + 0.1);
                    inputSpeedVoz.value = newValue.toFixed(1);
                });

                /* ===== CYCLE-BASED COLOR PICKER SYSTEM ===== */
                
                // Color palette
                const colorPalette = [
                    { name: 'Branco', hex: '#FFFFFF' },
                    { name: 'Preto', hex: '#000000' },
                    { name: 'Amarelo', hex: '#FFFF00' },
                    { name: 'Azul', hex: '#0000FF' },
                    { name: 'Azul Escuro', hex: '#0747A6' },
                    { name: 'Verde', hex: '#00AA00' },
                    { name: 'Verde Escuro', hex: '#004400' },
                    { name: 'Vermelho', hex: '#FF0000' },
                    { name: 'Marrom', hex: '#8B4513' },
                    { name: 'Roxo', hex: '#AA00FF' },
                    { name: 'Bege', hex: '#F5DEB3' },
                    { name: 'Laranja', hex: '#FF8C00' }
                ];

                // Cycle memory: each cycle stores its color preferences
                const cycleMemory = {
                    1: { bgColor: '#FFFFFF', textColor: '#000000', destaqueEnable: false, destaqueBgColor: '#FFFF00', destaqueTextColor: '#0000FF' },
                    2: { bgColor: null, textColor: null, destaqueEnable: false, destaqueBgColor: null, destaqueTextColor: null },
                    3: { bgColor: null, textColor: null, destaqueEnable: false, destaqueBgColor: null, destaqueTextColor: null },
                    4: { bgColor: null, textColor: null, destaqueEnable: false, destaqueBgColor: null, destaqueTextColor: null },
                    5: { bgColor: null, textColor: null, destaqueEnable: false, destaqueBgColor: null, destaqueTextColor: null }
                };

                // Current active cycle
                let activeCycleId = 1;
                let colorPickerMode = null; // 'background', 'text', 'destaque-bg', 'destaque-text'
                let selectedColorType = null; // 'bgColor', 'textColor', 'destaqueBgColor', 'destaqueTextColor'

                const leituraOverlay = document.getElementById('color-picker-leitura-overlay');
                const destaqueOverlay = document.getElementById('color-picker-destaque-overlay');

                // Update all cycle buttons visual state
                const updateCycleButtons = () => {
                    document.querySelectorAll('.contrast-cycle-btn').forEach(btn => {
                        const cycleId = parseInt(btn.dataset.cycleId);
                        if (cycleId === activeCycleId) {
                            btn.classList.add('active');
                            btn.classList.remove('inactive');
                        } else {
                            btn.classList.remove('active');
                            btn.classList.add('inactive');
                        }
                    });
                };

                // Update all trigger button swatches based on active cycle
                const updateTriggerSwatches = () => {
                    const cycle = cycleMemory[activeCycleId];
                    
                    // Update color trigger buttons with cycle colors
                    const bgLeituraBtn = document.querySelector('#btn-cor-fundo-leitura .color-picker-trigger-swatch');
                    const textLeituraBtn = document.querySelector('#btn-cor-letra-leitura .color-picker-trigger-swatch');
                    const bgDestaqueBtn = document.querySelector('#btn-cor-fundo-destaque .color-picker-trigger-swatch');
                    const textDestaqueBtn = document.querySelector('#btn-cor-texto-destaque .color-picker-trigger-swatch');
                    
                    if (bgLeituraBtn) bgLeituraBtn.style.backgroundColor = cycle.bgColor || '#FFFFFF';
                    if (textLeituraBtn) textLeituraBtn.style.backgroundColor = cycle.textColor || '#000000';
                    if (bgDestaqueBtn) bgDestaqueBtn.style.backgroundColor = cycle.destaqueBgColor || '#FFFF00';
                    if (textDestaqueBtn) textDestaqueBtn.style.backgroundColor = cycle.destaqueTextColor || '#0000FF';

                    // Update preview box
                    const previewBox = document.querySelector('.preview-box');
                    if (previewBox) {
                        previewBox.style.background = cycle.bgColor || '#FFFFFF';  // Use background to override gradient
                        previewBox.style.color = cycle.textColor || '#000000';
                    }

                    // Update destaque toggle state
                    const destaqueToggle = document.getElementById('tgl-destaque');
                    const destaqueSubOptions = document.getElementById('destaque-sub-options');
                    if (destaqueToggle) {
                        destaqueToggle.checked = cycle.destaqueEnable;
                        if (destaqueSubOptions) {
                            if (cycle.destaqueEnable) {
                                destaqueSubOptions.classList.remove('disabled-section');
                            } else {
                                destaqueSubOptions.classList.add('disabled-section');
                            }
                        }
                    }
                };

                // Cycle button click handlers
                document.querySelectorAll('.contrast-cycle-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        activeCycleId = parseInt(btn.dataset.cycleId);
                        updateCycleButtons();
                        updateTriggerSwatches();
                    });
                });

                // Render color grid
                const renderColorGrid = (gridId, excludeColor = null) => {
                    const grid = document.getElementById(gridId);
                    if (!grid) return;
                    grid.innerHTML = '';
                    
                    colorPalette.forEach(color => {
                        const square = document.createElement('div');
                        square.className = 'color-square';
                        square.style.backgroundColor = color.hex;
                        square.title = color.name;
                        
                        if (excludeColor && color.hex === excludeColor) {
                            square.classList.add('disabled');
                        } else {
                            square.addEventListener('click', () => selectColor(color.hex, square));
                        }
                        
                        grid.appendChild(square);
                    });
                };

                // Select color in picker - now saves to active cycle
                const selectColor = (hex, squareEl) => {
                    const cycle = cycleMemory[activeCycleId];
                    
                    // Mark as selected
                    document.querySelectorAll('.color-square').forEach(sq => sq.classList.remove('selected'));
                    if (squareEl) squareEl.classList.add('selected');
                    
                    // Save to active cycle
                    if (selectedColorType) {
                        cycle[selectedColorType] = hex;
                        
                        // Update preview in overlay based on which color type was selected
                        if (selectedColorType === 'bgColor') {
                            const leituraPreview = document.getElementById('color-picker-leitura-preview');
                            if (leituraPreview) {
                                leituraPreview.style.background = hex;  // Use background, not backgroundColor
                            }
                        } else if (selectedColorType === 'textColor') {
                            const leituraHighlight = document.getElementById('leitura-preview-highlight');
                            if (leituraHighlight) {
                                leituraHighlight.style.color = hex;
                            }
                        } else if (selectedColorType === 'destaqueBgColor') {
                            const destaquePreview = document.getElementById('color-picker-destaque-preview');
                            if (destaquePreview) {
                                destaquePreview.style.background = hex;  // Use background, not backgroundColor
                            }
                        } else if (selectedColorType === 'destaqueTextColor') {
                            const destaqueHighlight = document.getElementById('destaque-preview-highlight');
                            if (destaqueHighlight) {
                                destaqueHighlight.style.color = hex;
                            }
                        }
                        
                        // Update trigger buttons
                        updateTriggerSwatches();
                    }
                };

                // Button handlers for individual color types
                const openColorPicker = (colorType, gridId) => {
                    selectedColorType = colorType;
                    const cycle = cycleMemory[activeCycleId];
                    const currentColor = cycle[colorType];
                    
                    renderColorGrid(gridId, currentColor);
                    
                    // Determine which overlay to show and initialize preview
                    if (colorType === 'bgColor' || colorType === 'textColor') {
                        if (leituraOverlay) {
                            const instruction = document.getElementById('color-picker-leitura-instruction');
                            const leituraPreview = document.getElementById('color-picker-leitura-preview');
                            
                            if (instruction) {
                                instruction.innerText = colorType === 'bgColor' 
                                    ? 'Escolha a COR DE FUNDO' 
                                    : 'Escolha a COR DO TEXTO';
                            }
                            
                            // Initialize preview with current cycle colors
                            if (leituraPreview) {
                                leituraPreview.style.background = cycle.bgColor || '#FFFFFF';  // Use background to override gradient
                                leituraPreview.style.color = cycle.textColor || '#000000';
                            }
                            
                            leituraOverlay.classList.remove('hidden');
                        }
                    } else if (colorType === 'destaqueBgColor' || colorType === 'destaqueTextColor') {
                        if (destaqueOverlay) {
                            const instruction = document.getElementById('color-picker-destaque-instruction');
                            const destaquePreview = document.getElementById('color-picker-destaque-preview');
                            
                            if (instruction) {
                                instruction.innerText = colorType === 'destaqueBgColor' 
                                    ? 'Escolha a COR DE DESTAQUE' 
                                    : 'Escolha a COR DO TEXTO DE DESTAQUE';
                            }
                            
                            // Initialize preview with current cycle colors
                            if (destaquePreview) {
                                destaquePreview.style.background = cycle.destaqueBgColor || '#FFFF00';  // Use background to override gradient
                                const destaqueHighlight = document.getElementById('destaque-preview-highlight');
                                if (destaqueHighlight) destaqueHighlight.style.color = cycle.destaqueTextColor || '#0000FF';
                            }
                            
                            destaqueOverlay.classList.remove('hidden');
                        }
                    }
                };

                // Individual button handlers
                document.getElementById('btn-cor-fundo-leitura')?.addEventListener('click', () => {
                    openColorPicker('bgColor', 'color-picker-leitura-grid');
                });

                document.getElementById('btn-cor-letra-leitura')?.addEventListener('click', () => {
                    openColorPicker('textColor', 'color-picker-leitura-grid');
                });

                document.getElementById('btn-cor-fundo-destaque')?.addEventListener('click', () => {
                    openColorPicker('destaqueBgColor', 'color-picker-destaque-grid');
                });

                document.getElementById('btn-cor-texto-destaque')?.addEventListener('click', () => {
                    openColorPicker('destaqueTextColor', 'color-picker-destaque-grid');
                });

                // Close/Save buttons
                document.getElementById('btn-color-cancel-leitura')?.addEventListener('click', () => {
                    if (leituraOverlay) leituraOverlay.classList.add('hidden');
                    selectedColorType = null;
                });

                document.getElementById('btn-color-save-leitura')?.addEventListener('click', () => {
                    if (leituraOverlay) leituraOverlay.classList.add('hidden');
                    selectedColorType = null;
                    alert('✓ Cores do ciclo ' + activeCycleId + ' salvas com sucesso!');
                });

                document.getElementById('btn-color-cancel-destaque')?.addEventListener('click', () => {
                    if (destaqueOverlay) destaqueOverlay.classList.add('hidden');
                    selectedColorType = null;
                });

                document.getElementById('btn-color-save-destaque')?.addEventListener('click', () => {
                    if (destaqueOverlay) destaqueOverlay.classList.add('hidden');
                    selectedColorType = null;
                    alert('✓ Cores do ciclo ' + activeCycleId + ' salvas com sucesso!');
                });

                // Personalizar Contraste button - open cycle selector or color picker
                document.getElementById('btn-personalizar-contraste')?.addEventListener('click', () => {
                    // For now, just ensure cycle 1 is selected and show tutorial
                    if (activeCycleId !== 1) {
                        activeCycleId = 1;
                        updateCycleButtons();
                        updateTriggerSwatches();
                    }
                    alert('💡 Dica: Clique em qualquer ciclo (1-5) acima para selecioná-lo, depois clique nos botões de cor para alterar suas cores. Ciclo 1 é o padrão.');
                });

                // Initialize cycle display
                updateCycleButtons();
                updateTriggerSwatches();

                // Toggle destaque options
                document.getElementById('tgl-destaque')?.addEventListener('change', (e) => {
                    const destaqueSubOptions = document.getElementById('destaque-sub-options');
                    const isChecked = e.target.checked;
                    
                    if (isChecked) {
                        destaqueSubOptions?.classList.remove('disabled-section');
                    } else {
                        destaqueSubOptions?.classList.add('disabled-section');
                    }
                    
                    // Update active cycle memory
                    cycleMemory[activeCycleId].destaqueEnable = isChecked;
                });

                document.querySelectorAll('input[name="tipo-leitura"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        const telepontoOpts = document.getElementById('opcoes-teleponto');
                        if(telepontoOpts) telepontoOpts.classList.toggle('disabled-section', e.target.value === 'linha');
                    });
                });

                // Botões de Rodapé (Voltar com Confirmação e Salvar)
                const voltarParaDash = () => loadScreen('_dashboard');
                document.getElementById('btn-settings-voltar-fixo')?.addEventListener('click', () => {
                    if(confirm("Deseja sair da tela de configurações? Algumas alterações podem não ter sido salvas.")) voltarParaDash();
                });
                document.getElementById('btn-settings-salvar')?.addEventListener('click', () => {
                    alert("Mockup: Configurações salvas com sucesso!");
                });

                // Restaura o bloco de perfil por padrão ao entrar
                const blockPerfil = document.getElementById('block-perfil');
                if (blockPerfil) blockPerfil.style.display = 'block';

                // --- Fluxo de Gerenciamento de Perfil (In-Page) ---
                const modalNomePerfil = document.getElementById('modal-nome-perfil');
                const modalListaPerfis = document.getElementById('modal-lista-perfis');
                const scrollAreaConfig = document.getElementById('settings-scroll-area');

                // Configuração básica para fechar modais
                document.querySelectorAll('.modal-overlay .btn-close').forEach(btn => {
                    btn.addEventListener('click', (e) => e.target.closest('.modal-overlay').classList.remove('show'));
                });

                // Se foi redirecionado do botão "Criar novo usuário"
                if (appState.startCreateProfileFlow) {
                    appState.startCreateProfileFlow = false;
                    if (blockPerfil) blockPerfil.style.display = 'none';
                    if (scrollAreaConfig) scrollAreaConfig.scrollTop = 0;
                    if (modalNomePerfil) {
                        document.getElementById('input-nome-novo-perfil').value = '';
                        modalNomePerfil.classList.add('show');
                    }
                }
                
                // 1. Ação de Criar Perfil
                document.getElementById('btn-criar-perfil')?.addEventListener('click', () => {
                    document.getElementById('input-nome-novo-perfil').value = '';
                    modalNomePerfil.classList.add('show');
                });

                document.getElementById('btn-confirmar-nome-perfil')?.addEventListener('click', () => {
                    const nome = document.getElementById('input-nome-novo-perfil').value.trim();
                    if (!nome) return alert("Por favor, insira um nome para o perfil.");
                    
                    modalNomePerfil.classList.remove('show');
                    
                    // "Esconde" o bloco de perfil e rola para o topo (Áudio)
                    const blockPerfil = document.getElementById('block-perfil');
                    if (blockPerfil) blockPerfil.style.display = 'none';
                    
                    if (scrollAreaConfig) scrollAreaConfig.scrollTop = 0;
                    
                    // Mensagem contextual no rodapé
                    const btnSalvar = document.getElementById('btn-settings-salvar');
                    if (btnSalvar) {
                        btnSalvar.style.borderColor = '#4CAF50';
                        btnSalvar.style.backgroundColor = '#e8f5e9';
                        btnSalvar.querySelector('.btn-main-label').innerText = "Concluir";
                        btnSalvar.querySelector('.btn-main-label').style.color = '#4CAF50';
                    }
                });

                // 2. Ações de Editar e Excluir (Usam o mesmo modal de listagem)
                const abrirListaPerfis = (acao) => {
                    const titulo = document.getElementById('titulo-modal-lista');
                    const container = document.getElementById('container-lista-perfis');
                    
                    titulo.innerText = acao === 'editar' ? 'Qual perfil deseja editar?' : 'Qual perfil deseja excluir?';
                    
                    // Mockup: Lista fixa de exemplo
                    const perfisExemplo = ['João', 'Maria', 'Carlos'];
                    container.innerHTML = '';
                    
                    perfisExemplo.forEach(p => {
                        const div = document.createElement('div');
                        div.className = 'lista-perfis-item';
                        div.innerText = p;
                        div.onclick = () => {
                            if (acao === 'excluir') {
                                if (confirm(`Tem certeza que deseja excluir o perfil "${p}" permanentemente?`)) {
                                    alert(`Perfil "${p}" excluído com sucesso!`);
                                    modalListaPerfis.classList.remove('show');
                                }
                            } else { // Editar
                                alert(`Mockup: Carregando configurações do perfil "${p}"...`);
                                modalListaPerfis.classList.remove('show');
                                if (scrollAreaConfig) scrollAreaConfig.scrollTop = 0;
                            }
                        };
                        container.appendChild(div);
                    });
                    
                    modalListaPerfis.classList.add('show');
                };

                document.getElementById('btn-editar-perfil')?.addEventListener('click', () => abrirListaPerfis('editar'));
                document.getElementById('btn-excluir-perfil')?.addEventListener('click', () => abrirListaPerfis('excluir'));
            }
        };
        actions[screenName]?.();
    };

    // Carrega a tela inicial por padrão
    applyProfile(appState.activeProfile); // Aplica o perfil padrão no início
    loadScreen('_home');
});