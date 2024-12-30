function DarkMode() {
    this.darkModeToggle = document.getElementById('darkModeToggle');
    console.log('darkModeToggle element:', this.darkModeToggle);
    
    if (!this.darkModeToggle) {
        console.error('Dark mode toggle button not found!');
        return;
    }
    
    // Get the stored theme
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    console.log('Initializing dark mode, isDarkMode:', this.isDarkMode);
    
    // Initialize dark mode state
    if (this.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        this.darkModeToggle.classList.add('active'); // Light mode = active (red bar)
    }
    
    // Set up event listeners
    console.log('Setting up event listeners');
    this.darkModeToggle.addEventListener('click', () => {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.darkModeToggle.classList.remove('active'); // Dark mode = no active (white bar)
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            this.darkModeToggle.classList.add('active'); // Light mode = active (red bar)
        }
    });
}

// Initialize dark mode when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log
    new DarkMode();
}); 