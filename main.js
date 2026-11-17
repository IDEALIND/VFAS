(function () {
  'use strict';

  // Ano atual automático no rodapé
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Cabeçalho fixo, menu mobile e scroll spy
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navLinks = document.querySelectorAll('.nav__link');
  const allMenuLinks = document.querySelectorAll('.nav__link, .nav__sub a, .nav__cta');
  const sections = Array.from(navLinks)
    .map((link) => {
      const href = link.getAttribute('href') || '';
      return href.startsWith('#') && href.length > 1 ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
  }

  function toggleMenu() {
    if (!nav || !burger) return;
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
  }

  if (burger) {
    burger.addEventListener('click', toggleMenu);
  }

  allMenuLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
    }

    if (sections.length > 1) {
      const probe = y + (header ? header.offsetHeight : 86) + 120;
      let activeId = sections[0] ? sections[0].id : '';
      for (const sec of sections) {
        if (sec.offsetTop <= probe) {
          activeId = sec.id;
        }
      }
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeId);
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Animações discretas ao rolar a página
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // Carrossel de Depoimentos (loop contínuo, setas, indicadores e swipe mobile)
  const carousel = document.getElementById('carousel');
  if (carousel) {
    const viewport = carousel.querySelector('.carousel__viewport');
    const track = carousel.querySelector('.carousel__track');
    const prevBtn = carousel.querySelector('.carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.carousel__arrow--next');
    const dotsWrap = carousel.querySelector('.carousel__dots');
    const origCards = Array.from(track.children);
    const total = origCards.length;

    origCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    let index = 0;
    let timer = null;

    const dots = origCards.map((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', 'Ir para depoimento ' + (i + 1));
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        goTo(i);
        restartAuto();
      });
      dotsWrap.appendChild(btn);
      return btn;
    });

    function getStepWidth() {
      const first = track.children[0];
      if (!first) return 0;
      const style = window.getComputedStyle(first);
      const mr = parseFloat(style.marginRight) || 0;
      return first.getBoundingClientRect().width + mr;
    }

    function render(animate = true) {
      const step = getStepWidth();
      track.style.transition = animate ? 'transform .6s cubic-bezier(.22,.7,.2,1)' : 'none';
      track.style.transform = `translate3d(${-index * step}px, 0, 0)`;
      const activeDot = ((index % total) + total) % total;
      dots.forEach((d, i) => d.setAttribute('aria-selected', i === activeDot ? 'true' : 'false'));
    }

    function goTo(newIndex) {
      index = ((newIndex % total) + total) % total;
      render(true);
    }

    function next() {
      index += 1;
      render(true);
      if (index >= total) {
        setTimeout(() => {
          if (index >= total) {
            index = index % total;
            render(false);
          }
        }, 620);
      }
    }

    function prev() {
      if (index <= 0) {
        index = total;
        render(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            index = total - 1;
            render(true);
          });
        });
      } else {
        index -= 1;
        render(true);
      }
    }

    function startAuto() {
      stopAuto();
      timer = setInterval(next, 6000);
    }

    function stopAuto() {
      if (timer) clearInterval(timer);
    }

    function restartAuto() {
      stopAuto();
      startAuto();
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAuto(); });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    let startX = 0;
    let deltaX = 0;
    let dragging = false;

    viewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      deltaX = 0;
      dragging = true;
      stopAuto();
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(deltaX) > 42) {
        if (deltaX < 0) next();
        else prev();
      }
      startAuto();
    });

    window.addEventListener('resize', () => render(false));
    render(false);
    startAuto();
  }

  // Abas interativas — Novembro Azul (com suporte a teclado)
  const tabButtons = Array.from(document.querySelectorAll('.nov-tabs__btn'));
  const tabPanels = document.querySelectorAll('.nov-tabs__panel');
  if (tabButtons.length && tabPanels.length) {
    function activateTab(btn) {
      const targetId = btn.getAttribute('aria-controls');
      tabButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      tabPanels.forEach((panel) => {
        const active = panel.id === targetId;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    }

    tabButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => activateTab(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const nextBtn = tabButtons[(idx + dir + tabButtons.length) % tabButtons.length];
          nextBtn.focus();
          activateTab(nextBtn);
        }
      });
    });
  }

  // Abas interativas — Módulo de Enfermagem (com suporte a teclado)
  const enfTabButtons = Array.from(document.querySelectorAll('.nursing-tab__btn'));
  const enfTabPanels = document.querySelectorAll('.nursing-panel');
  if (enfTabButtons.length && enfTabPanels.length) {
    function activateEnfTab(btn) {
      const targetId = btn.getAttribute('aria-controls');
      enfTabButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      enfTabPanels.forEach((panel) => {
        const active = panel.id === targetId;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    }

    enfTabButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => activateEnfTab(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const nextBtn = enfTabButtons[(idx + dir + enfTabButtons.length) % enfTabButtons.length];
          nextBtn.focus();
          activateEnfTab(nextBtn);
        }
      });
    });
  }

  // Máscara automática para campos de Telefone / WhatsApp
  const telInputs = document.querySelectorAll('input[type="tel"]');
  telInputs.forEach((input) => {
    input.addEventListener('input', () => {
      let digits = input.value.replace(/\D/g, '').slice(0, 11);
      if (digits.length > 6) {
        const split = digits.length === 11 ? 7 : 6;
        input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
      } else if (digits.length > 2) {
        input.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      } else if (digits.length > 0) {
        input.value = `(${digits}`;
      } else {
        input.value = '';
      }
    });
  });

  // Data mínima hoje nos campos de data
  const dateInputs = document.querySelectorAll('input[type="date"]');
  if (dateInputs.length) {
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach((inp) => {
      if (!inp.min) inp.min = today;
    });
  }

  function formatDateBR(iso) {
    if (!iso || !iso.includes('-')) return iso || 'Não informada';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // Formulário 1: Transporte de Pacientes -> WhatsApp
  const formRemocao = document.getElementById('form-remocao');
  if (formRemocao) {
    formRemocao.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(formRemocao);
      const quem = (fd.get('quem') || '').toString().trim();
      const mobilidade = (fd.get('mobilidade') || '').toString().trim();
      const origem = (fd.get('origem') || '').toString().trim();
      const destino = (fd.get('destino') || '').toString().trim();
      const data = formatDateBR((fd.get('data') || '').toString().trim());
      const acompanhamento = (fd.get('acompanhamento') || '').toString().trim();
      const responsavel = (fd.get('responsavel') || '').toString().trim();
      const whatsapp = (fd.get('whatsapp') || '').toString().trim();
      const obs = (fd.get('obs') || '').toString().trim();

      const lines = [
        'Olá, equipe *Vital Family*! Gostaria de solicitar a avaliação para um *Transporte de Paciente*:',
        '',
        `• *Quem precisa do transporte:* ${quem}`,
        `• *Condição de mobilidade:* ${mobilidade}`,
        `• *Endereço/Local de origem:* ${origem}`,
        `• *Endereço/Local de destino:* ${destino}`,
        `• *Data desejada:* ${data}`,
        `• *Uso de equipamentos e insumos:* ${acompanhamento}`,
        `• *Nome do responsável:* ${responsavel}`,
        `• *Telefone/WhatsApp:* ${whatsapp}`,
      ];
      if (obs) {
        lines.push(`• *Observações adicionais:* ${obs}`);
      }
      lines.push('', 'Aguardo a validação de disponibilidade e orientações da equipe. Obrigado(a)!');

      const url = 'https://wa.me/5584998409453?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  }

  // Formulário 2: Home Care -> WhatsApp
  const formHomeCare = document.getElementById('form-homecare');
  if (formHomeCare) {
    formHomeCare.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(formHomeCare);
      const responsavel = (fd.get('responsavel') || '').toString().trim();
      const whatsapp = (fd.get('whatsapp') || '').toString().trim();
      const cidade = (fd.get('cidade') || '').toString().trim();
      const paciente = (fd.get('paciente') || '').toString().trim();
      const necessidades = (fd.get('necessidades') || '').toString().trim();

      const lines = [
        'Olá, equipe *Vital Family*! Quero saber mais sobre o atendimento de *Home Care*:',
        '',
        `• *Nome do responsável:* ${responsavel}`,
        `• *WhatsApp de contato:* ${whatsapp}`,
        `• *Cidade/Bairro:* ${cidade}`,
      ];
      if (paciente) {
        lines.push(`• *Paciente (nome/idade):* ${paciente}`);
      }
      lines.push(`• *Necessidades de assistência:* ${necessidades}`);
      lines.push('', 'Aguardo o retorno da equipe para orientação. Obrigado(a)!');

      const url = 'https://wa.me/5584998409453?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  }

  // Formulário 3: Locação de Ambulâncias -> WhatsApp
  const formLocacao = document.getElementById('form-locacao');
  if (formLocacao) {
    formLocacao.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(formLocacao);
      const responsavel = (fd.get('responsavel') || '').toString().trim();
      const whatsapp = (fd.get('whatsapp') || '').toString().trim();
      const finalidade = (fd.get('finalidade') || '').toString().trim();
      const periodo = (fd.get('periodo') || '').toString().trim();
      const cidade = (fd.get('cidade') || '').toString().trim();
      const obs = (fd.get('obs') || '').toString().trim();

      const lines = [
        'Olá, equipe *Vital Family*! Gostaria de solicitar um orçamento para *Locação de Ambulância*:',
        '',
        `• *Nome / Empresa:* ${responsavel}`,
        `• *Telefone / WhatsApp:* ${whatsapp}`,
        `• *Finalidade:* ${finalidade}`,
        `• *Data / Período:* ${periodo}`,
        `• *Cidade / Local:* ${cidade}`,
      ];
      if (obs) {
        lines.push(`• *Observações:* ${obs}`);
      }
      lines.push('', 'Aguardo o retorno da equipe comercial. Obrigado(a)!');

      const url = 'https://wa.me/5584998409453?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  }

  // Formulário 4: Assistência em Eventos -> WhatsApp
  const formEventos = document.getElementById('form-eventos');
  if (formEventos) {
    formEventos.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(formEventos);
      const responsavel = (fd.get('responsavel') || '').toString().trim();
      const whatsapp = (fd.get('whatsapp') || '').toString().trim();
      const tipo = (fd.get('tipo') || '').toString().trim();
      const publico = (fd.get('publico') || '').toString().trim();
      const data = (fd.get('data') || '').toString().trim();
      const local = (fd.get('local') || '').toString().trim();
      const obs = (fd.get('obs') || '').toString().trim();

      const lines = [
        'Olá, equipe *Vital Family*! Gostaria de solicitar um orçamento de *Assistência em Eventos (Apoio Ambulatorial)*:',
        '',
        `• *Nome / Organização:* ${responsavel}`,
        `• *Telefone / WhatsApp:* ${whatsapp}`,
        `• *Tipo de evento:* ${tipo}`,
        `• *Público estimado:* ${publico}`,
        `• *Data e horário:* ${data}`,
        `• *Cidade / Local:* ${local}`,
      ];
      if (obs) {
        lines.push(`• *Observações:* ${obs}`);
      }
      lines.push('', 'Aguardo o retorno da equipe para alinhamento da cobertura. Obrigado(a)!');

      const url = 'https://wa.me/5584998409453?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  }

  // Formulário 5: Serviços de Enfermagem -> WhatsApp
  const formEnfMini = document.getElementById('form-enfermagem-mini');
  const formEnfFull = document.getElementById('form-enfermagem');
  [formEnfMini, formEnfFull].filter(Boolean).forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const nome = (fd.get('nome') || fd.get('responsavel') || '').toString().trim();
      const whatsapp = (fd.get('whatsapp') || '').toString().trim();
      const servico = (fd.get('servico') || '').toString().trim();
      const local = (fd.get('local') || fd.get('cidade') || '').toString().trim();
      const obs = (fd.get('obs') || fd.get('necessidades') || '').toString().trim();

      const lines = [
        'Olá, equipe *Vital Family*! Gostaria de solicitar atendimento de *Serviços de Enfermagem*:',
        '',
        `• *Nome / Solicitante:* ${nome}`,
        `• *Telefone / WhatsApp:* ${whatsapp}`,
        `• *Serviço de interesse:* ${servico}`,
        `• *Local / Bairro ou Empresa:* ${local}`,
      ];
      if (obs) {
        lines.push(`• *Detalhes / Observações:* ${obs}`);
      }
      lines.push('', 'Aguardo as orientações e disponibilidade da equipe técnica. Obrigado(a)!');

      const url = 'https://wa.me/5584998409453?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  });
})();
