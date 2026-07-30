import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		screens: {
			'xs': '360px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				header: {
					DEFAULT: 'hsl(var(--header-background))',
					foreground: 'hsl(var(--header-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
\t\t\t\t\t\t\tDEFAULT: 'hsl(var(--muted))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--muted-foreground))'
\t\t\t\t\t\t\t},
\t\t\t\t\t\taccent: {
\t\t\t\t\t\t\tDEFAULT: 'hsl(var(--accent))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--accent-foreground))'
\t\t\t\t\t\t\t},
\t\t\t\t\t\tpopover: {
\t\t\t\t\t\t\tDEFAULT: 'hsl(var(--popover))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--popover-foreground))'
\t\t\t\t\t\t\t},

\t\t\t\t\t\tcard: {
\t\t\t\t\t\t\tDEFAULT: 'hsl(var(--card))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--card-foreground))',
\t\t\t\t\t\t\tdark: 'hsl(var(--card-dark))',
\t\t\t\t\t\t\t'dark-foreground': 'hsl(var(--card-dark-foreground))',
\t\t\t\t\t\t\tpurple: 'hsl(var(--card-purple))',
\t\t\t\t\t\t\t'purple-foreground': 'hsl(var(--card-purple-foreground))'
\t\t\t\t\t\t},
\t\t\t\t\t\tsidebar: {
\t\t\t\t\t\t\tDEFAULT: 'hsl(var(--sidebar-background))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--sidebar-foreground))',
\t\t\t\t\t\t\tprimary: 'hsl(var(--sidebar-primary))',
\t\t\t\t\t\t\t'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
\t\t\t\t\t\t\taccent: 'hsl(var(--sidebar-accent))',
\t\t\t\t\t\t\t'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
\t\t\t\t\t\t\tborder: 'hsl(var(--sidebar-border))',
\t\t\t\t\t\t\tring: 'hsl(var(--sidebar-ring))'
\t\t\t\t\t\t},
\t\t\t\t\t\tvinyl: {
\t\t\t\t\t\t\tgold: 'hsl(var(--vinyl-gold))',
\t\t\t\t\t\t\tsilver: 'hsl(var(--vinyl-silver))',
\t\t\t\t\t\t\tblack: 'hsl(var(--vinyl-black))',
\t\t\t\t\t\t\tpurple: 'hsl(var(--vinyl-purple))'
\t\t\t\t\t\t},
\t\t\t\t\t\techo: {
\t\t\t\t\t\t\tviolet: 'hsl(var(--echo-violet))',
\t\t\t\t\t\t\tlavender: 'hsl(var(--echo-lavender))',
\t\t\t\t\t\t\tgold: 'hsl(var(--echo-gold))',
\t\t\t\t\t\t\tcream: 'hsl(var(--echo-cream))'
\t\t\t\t\t\t},
\t\t\t\t\t\tchristmas: {
\t\t\t\t\t\t\tred: 'hsl(var(--christmas-red))',
\t\t\t\t\t\t\tgreen: 'hsl(var(--christmas-green))',
\t\t\t\t\t\t\tgold: 'hsl(var(--christmas-gold))',
\t\t\t\t\t\t\tcream: 'hsl(var(--christmas-cream))',
\t\t\t\t\t\t\tburgundy: 'hsl(var(--christmas-burgundy))',
\t\t\t\t\t\t\tpine: 'hsl(var(--christmas-pine))'
\t\t\t\t\t\t},
\t\t\t\t\t\t'ai-nudge': {
\t\t\t\t\t\t\tbackground: 'hsl(var(--ai-nudge-background))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--ai-nudge-foreground))',
\t\t\t\t\t\t\tborder: 'hsl(var(--ai-nudge-border))'
\t\t\t\t\t\t},
\t\t\t\t\t\t'chat-nudge': { // Added chat-nudge colors
\t\t\t\t\t\t\tbackground: 'hsl(var(--chat-nudge-background))',
\t\t\t\t\t\t\tforeground: 'hsl(var(--chat-nudge-foreground))',
\t\t\t\t\t\t\tborder: 'hsl(var(--chat-nudge-border))'
\t\t\t\t\t\t}
\t\t\t\t},
\t\t\tbackgroundImage: {
\t\t\t\t'gradient-vinyl': 'var(--gradient-vinyl)',
\t\t\t\t'gradient-scan': 'var(--gradient-scan)'
\t\t\t},
\t\t\tborderRadius: {
\t\t\t\tlg: 'var(--radius)',
\t\t\t\tmd: 'calc(var(--radius) - 2px)',
\t\t\t\tsm: 'calc(var(--radius) - 4px)'
\t\t\t},
\t\t\tkeyframes: {
\t\t\t\t'accordion-down': {
\t\t\t\t\tfrom: {
\t\t\t\t\t\theight: '0'
\t\t\t\t\t},
\t\t\t\t\tto: {
\t\t\t\t\t\theight: 'var(--radix-accordion-content-height)'
\t\t\t\t\t}
\t\t\t\t},
\t\t\t\t'accordion-up': {
\t\t\t\t\tfrom: {
\t\t\t\t\t\theight: 'var(--radix-accordion-content-height)'
\t\t\t\t\t},
\t\t\t\t\tto: {
\t\t\t\t\t\theight: '0'
\t\t\t\t\t}
\t\t\t\t},
\t\t\t\t'vinyl-spin': {
\t\t\t\t\tfrom: {
\t\t\t\t\t\ttransform: 'rotate(0deg)'
\t\t\t\t\t},
\t\t\t\t\tto: {
\t\t\t\t\t\ttransform: 'rotate(360deg)'
\t\t\t\t\t}
\t\t\t\t},
\t\t\t\t'fade-in': {
\t\t\t\t\tfrom: {
\t\t\t\t\t\topacity: '0',
\t\t\t\t\t\ttransform: 'translateY(20px)'
\t\t\t\t\t},
\t\t\t\t\tto: {
\t\t\t\t\t\topacity: '1',
\t\t\t\t\t\ttransform: 'translateY(0)'
\t\t\t\t\t}
\t\t\t\t},
\t\t\t\t'scan-pulse': {
\t\t\t\t\t'0%, 100%': {
\t\t\t\t\t\tboxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)'
\t\t\t\t\t},
\t\t\t\t\t'50%': {
\t\t\t\t\t\tboxShadow: '0 0 0 15px hsl(var(--primary) / 0)'
\t\t\t\t\t}
\t\t\t\t}
\t\t\t},
\t\t\tanimation: {
\t\t\t\t'accordion-down': 'accordion-down 0.2s ease-out',
\t\t\t\t'accordion-up': 'accordion-up 0.2s ease-out',
\t\t\t\t'vinyl-spin': 'vinyl-spin 4s linear infinite',
\t\t\t\t'fade-in': 'fade-in 0.6s ease-out',
\t\t\t\t'scan-pulse': 'scan-pulse 2s infinite',
\t\t\t\t'spin-slow': 'spin 3s linear infinite'
\t\t\t},
\t\t	typography: {
\t\t\t\tDEFAULT: {
\t\t\t\t\tcss: {
\t\t\t\t\t\tmaxWidth: 'none',
\t\t\t\t\t\tcolor: 'inherit',
\t\t\t\t\t\th2: {
\t\t\t\t\t\t\tfontWeight: '700',
\t\t\t\t\t\t\tletterSpacing: '-0.025em',
\t\t\t\t\t\t\tmarginTop: '3rem',
\t\t\t\t\t\t\tmarginBottom: '1.5rem',
\t\t\t\t\t\t},
\t\t\t\t\t\th3: {
\t\t\t\t\t\t\tfontWeight: '600',
\t\t\t\t\t\t\tletterSpacing: '-0.025em',
\t\t\t\t\t\t\tmarginTop: '2rem',
\t\t\t\t\t\t\tmarginBottom: '1rem',
\t\t\t\t\t\t},
\t\t\t\t\t\tp: {
\t\t\t\t\t\t\tmarginTop: '1rem',
\t\t\t\t\t\t\tmarginBottom: '1rem',
\t\t\t\t\t\t},
\t\t\t\t\t\tstrong: {
\t\t\t\t\t\t\tfontWeight: '600',
\t\t\t\t\t\t\tcolor: 'inherit',
\t\t\t\t\t\t},
\t\t\t\t\t\ta: {
\t\t\t\t\t\t\tcolor: 'hsl(var(--primary))',
\t\t\t\t\t\t\ttextDecoration: 'none',
\t\t\t\t\t\t\t'&:hover': {
\t\t\t\t\t\t\t\ttextDecoration: 'underline',
\t\t\t\t\t\t\t},
\t\t\t\t\t\t},
\t\t\t\t\t},
\t\t\t\t}
\t\t\t}
\t\t}
\t},
\tplugins: [],
} satisfies Config;
