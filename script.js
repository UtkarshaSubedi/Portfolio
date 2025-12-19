// Custom cursor follow - using left/top so CSS transform centering works
const cursor = document.querySelector(".cursor");
if (cursor) {
  document.addEventListener("mousemove", (e) => {
    cursor.style.opacity = 1;
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = 0;
  });

  // Hide rotating arms when hovering interactive elements
  const interactiveEls = document.querySelectorAll("a, button, .nav-link");
  interactiveEls.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("no-orbit");
    });
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("no-orbit");
    });
  });
}

// Scramble / reveal animation for hero name (both words together)
function scrambleName(element, speed = 35) {
  if (!element) return;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const original = element.dataset.value || element.textContent.trim();
  const length = original.length;

  // Pre-generate when each character should lock, so whole string animates together
  const minSteps = 15;
  const maxSteps = 40;
  const lockFrames = [];
  for (let i = 0; i < length; i++) {
    if (original[i] === " ") {
      lockFrames.push(0); // spaces are always final
    } else {
      lockFrames.push(
        Math.floor(minSteps + Math.random() * (maxSteps - minSteps))
      );
    }
  }
  const totalFrames = Math.max(...lockFrames) + 5;

  let frame = 0;

  const update = () => {
    let output = "";
    for (let i = 0; i < length; i++) {
      const ch = original[i];
      if (ch === " ") {
        output += " ";
      } else if (frame >= lockFrames[i]) {
        // Revealed character - black (no wrapper needed, inherits default)
        output += `<span class="char-revealed">${ch}</span>`;
      } else {
        // Scrambled character - light color
        const randChar = letters[Math.floor(Math.random() * letters.length)];
        output += `<span class="char-scrambled">${randChar}</span>`;
      }
    }
    element.innerHTML = output;

    frame++;
    if (frame <= totalFrames) {
      setTimeout(update, speed);
    } else {
      element.textContent = original;
    }
  };

  element.innerHTML = "";
  update();
}

// Hero tagline typing
function typeTagline(element, text) {
  let index = 0;
  const speed = 60;

  const typeChar = () => {
    if (index <= text.length) {
      element.textContent = text.slice(0, index);
      index += 1;
      setTimeout(typeChar, speed);
    } else {
      element.style.borderRight = "none";
    }
  };

  element.style.opacity = 1;
  setTimeout(typeChar, 200);
}

// Theme toggle functionality
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
  // Default to light mode if no saved preference
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

// Initialize theme before DOM loads to prevent flash
initTheme();

// Basic escaping for user-provided terminal input to avoid HTML injection
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Terminal functionality
const terminalCommands = {
  // Whitelisted pages for cd command
  pages: {
    about: "about.html",
    projects: "projects.html",
    certs: "certs.html",
    blogs: "blogs.html",
    contact: "contact.html",
    home: "index.html"
  },
  
  // Whitelisted commands
  whitelist: ["cd", "ls", "whoami", "resume", "help", "clear", "exit", "quit", "theme"],
  
  help: () => {
    return [
      "Available commands:",
      "",
      "  <span class='cmd-highlight'>cd [page]</span>   Navigate to: about, projects, certs, blogs, home",
      "  <span class='cmd-highlight'>ls</span>          List available pages",
      "  <span class='cmd-highlight'>whoami</span>      Display portfolio owner info",
      "  <span class='cmd-highlight'>resume</span>      Download resume PDF",
      "  <span class='cmd-highlight'>theme</span>       Toggle light/dark mode",
      "  <span class='cmd-highlight'>clear</span>       Clear the terminal",
      "  <span class='cmd-highlight'>exit</span>        Close the terminal"
    ];
  },
  
  ls: () => {
    return [
      "about",
      "projects",
      "certs",
      "blogs",
      "contact"
    ];
  },
  
  whoami: () => {
    return [
      "Utkarsha Subedi",
      "Cyber Security Undergraduate",
      "",
      "Passionate about security, coding, and building cool stuff."
    ];
  },
  

  resume: () => {
    // Trigger resume download
    const link = document.createElement('a');
    link.href = '/resume.pdf';
    link.download = 'Utkarsha_Subedi_Resume.pdf';
    link.click();
    return [
      "Downloading resume...",
      "File: Utkarsha_Subedi_Resume.pdf"
    ];
  }
};

function initTerminal() {
  const overlay = document.getElementById("terminal-overlay");
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const hintBtn = document.getElementById("terminal-hint-btn");
  const terminalBtn = document.getElementById("terminal-btn");
  const cursorEl = document.querySelector(".cursor");
  
  if (!overlay || !input || !output) return;
  
  // Open terminal with Ctrl+M
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "m") {
      e.preventDefault();
      openTerminal();
    }
    // Close with Escape
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      closeTerminal();
    }
  });
  
  // Click hint button to open
  if (hintBtn) {
    hintBtn.addEventListener("click", openTerminal);
  }
  
  // Click terminal button in header to open
  if (terminalBtn) {
    terminalBtn.addEventListener("click", openTerminal);
  }
  
  // Click outside to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeTerminal();
    }
  });
  
  // Click inside terminal body to refocus input (but allow text selection)
  const terminalBody = document.getElementById("terminal-body");
  if (terminalBody) {
    terminalBody.addEventListener("click", (e) => {
      // Only focus if no text is selected (allows copying)
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        input.focus();
      }
    });
  }
  
  // Handle command input
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = input.value.trim();
      if (command) {
        processCommand(command);
      }
      input.value = "";
    }
  });
  
  function openTerminal() {
    overlay.classList.add("active");
    // Hide custom cursor
    if (cursorEl) cursorEl.style.display = "none";
    setTimeout(() => input.focus(), 100);
  }
  
  function closeTerminal() {
    overlay.classList.remove("active");
    // Show custom cursor again
    if (cursorEl) cursorEl.style.display = "block";
  }
  
  function addOutput(lines, className = "") {
    lines.forEach(line => {
      const div = document.createElement("div");
      div.className = "terminal-line" + (className ? " " + className : "");
      div.innerHTML = line || "&nbsp;";
      output.appendChild(div);
    });
    // Scroll to bottom
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
  }
  
  function processCommand(cmd) {
    // Echo the command
    addOutput([
      `<span class="terminal-prompt">visitor@portfolio:~$</span> ${escapeHtml(
        cmd
      )}`,
    ]);
    
    const parts = cmd.toLowerCase().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    // Check if command is whitelisted
    if (!terminalCommands.whitelist.includes(command)) {
      addOutput(
        [`Command not found: ${escapeHtml(command)}`],
        "terminal-error"
      );
      addOutput(["Type 'help' for available commands"], "terminal-info");
      addOutput([""]); 
      return;
    }
    
    switch (command) {
      case "cd":
        if (args.length === 0) {
          addOutput(["Usage: cd [page]"], "terminal-error");
          addOutput(["Available: about, projects, certs, blogs, home"], "terminal-info");
        } else if (args.length > 1) {
          addOutput(["cd: too many arguments"], "terminal-error");
        } else {
          const page = args[0].replace("/", "");
          if (terminalCommands.pages[page]) {
            addOutput([`Navigating to ${page}...`], "terminal-success");
            document.body.classList.add("page-transition");
            setTimeout(() => {
              window.location.href = terminalCommands.pages[page];
            }, 140);
          } else {
            addOutput(
              [`cd: ${escapeHtml(args[0])}: No such directory`],
              "terminal-error"
            );
            addOutput(["Available: about, projects, certs, blogs, home"], "terminal-info");
          }
        }
        break;
        
      case "ls":
        if (args.length > 0) {
          addOutput(
            [`ls: '${escapeHtml(args[0])}' not permitted`],
            "terminal-error"
          );
        } else {
          addOutput(terminalCommands.ls());
        }
        break;
        
      case "help":
        if (args.length > 0) {
          addOutput([`help: no arguments allowed`], "terminal-error");
        } else {
          addOutput(terminalCommands.help());
        }
        break;
        
      case "whoami":
        if (args.length > 0) {
          addOutput([`whoami: no arguments allowed`], "terminal-error");
        } else {
          addOutput(terminalCommands.whoami());
        }
        break;
        

      case "resume":
        if (args.length > 0) {
          addOutput([`resume: no arguments allowed`], "terminal-error");
        } else {
          addOutput(terminalCommands.resume());
        }
        break;

      case "clear":
        if (args.length > 0) {
          addOutput([`clear: no arguments allowed`], "terminal-error");
        } else {
          output.innerHTML = "";
        }
        break;
        
      case "exit":
      case "quit":
        if (args.length > 0) {
          addOutput([`${command}: no arguments allowed`], "terminal-error");
        } else {
          closeTerminal();
        }
        break;
        
      case "theme":
        if (args.length > 0) {
          addOutput([`${command}: no arguments allowed`], "terminal-error");
        } else {
          toggleTheme();
          const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
          addOutput([`Theme switched to ${currentTheme} mode`], "terminal-success");
        }
        break;
        
      default:
        addOutput([`Command not found: ${command}`], "terminal-error");
        addOutput(["Type 'help' for available commands"], "terminal-info");
    }
    
    addOutput([""]); // Empty line for spacing
  }
}

// Page init
document.addEventListener("DOMContentLoaded", () => {
  const heroName = document.getElementById("hero-name");
  const taglineEl = document.getElementById("hero-tagline-text");
  const body = document.body;

  // Fade-in on load
  body.classList.add("page-visible");

  if (heroName) {
    setTimeout(() => {
      scrambleName(heroName);
    }, 100);
  }

  if (taglineEl) {
    const fullText = taglineEl.textContent.trim();
    taglineEl.textContent = "";
    setTimeout(() => {
      typeTagline(taglineEl, fullText);
    }, 900);
  }

  // Animate page titles
  const pageTitles = {
    "about-title": 200,
    "education-title": 600,
    "experience-title": 1000,
    "projects-title": 200,
    "certs-title": 200,
    "blogs-title": 200
  };

  // Check if we're on home page (has hero-name) or other pages
  const isHomePage = !!document.getElementById("hero-name");
  const animationSpeed = isHomePage ? 35 : 20; // Faster for non-home pages

  Object.entries(pageTitles).forEach(([titleId, delay]) => {
    const titleElement = document.getElementById(titleId);
    if (titleElement) {
      setTimeout(() => {
        titleElement.style.opacity = 1;
        scrambleName(titleElement, animationSpeed);
      }, delay);
    }
  });

  // Theme toggle button
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Initialize terminal
  initTerminal();

  // Hover-only nav outlines: add/remove a helper class so brackets show on hover
  const navItems = document.querySelectorAll(".main-nav li");
  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => item.classList.add("hovering"));
    item.addEventListener("mouseleave", () => item.classList.remove("hovering"));
  });

  // Smooth page transitions for internal nav links
  const navLinks = document.querySelectorAll(".main-nav a.nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      // Skip if new tab/window or modifier key navigation
      if (link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      body.classList.add("page-transition");
      setTimeout(() => {
        window.location.href = link.href;
      }, 140);
    });
  });
});
