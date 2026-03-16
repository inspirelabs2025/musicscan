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
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
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
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					dark: 'hsl(var(--card-dark))',
					'dark-foreground': 'hsl(var(--card-dark-foreground))',
					purple: 'hsl(var(--card-purple))',
					'purple-foreground': 'hsl(var(--card-purple-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				vinyl: {
					gold: 'hsl(var(--vinyl-gold))',
					silver: 'hsl(var(--vinyl-silver))',
					black: 'hsl(var(--vinyl-black))',
					purple: 'hsl(var(--vinyl-purple))'
				},
				echo: {
					violet: 'hsl(var(--echo-violet))',
					lavender: 'hsl(var(--echo-lavender))',
					gold: 'hsl(var(--echo-gold))',
					cream: 'hsl(var(--echo-cream))'
				},
				christmas: {
					red: 'hsl(var(--christmas-red))',
					green: 'hsl(var(--christmas-green))',
					gold: 'hsl(var(--christmas-gold))',
					cream: 'hsl(var(--christmas-cream))',
					burgundy: 'hsl(var(--christmas-burgundy))',
					pine: 'hsl(var(--christmas-pine))'
				}
			},
			backgroundImage: {
				'gradient-vinyl': 'var(--gradient-vinyl)',
				'gradient-scan': 'var(--gradient-scan)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'vinyl-spin': {
					from: {
						transform: 'rotate(0deg)'
					},
					to: {
						transform: 'rotate(360deg)'
					}
				},
				'fade-in': {
					from: {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scan-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)'
					},
					'50%': {
						boxShadow: '0 0 0 15px hsl(var(--primary) / 0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'vinyl-spin': 'vinyl-spin 4s linear infinite',
				'fade-in': 'fade-in 0.6s ease-out',
				'scan-pulse': 'scan-pulse 2s infinite',
				'spin-slow': 'spin 3s linear infinite'
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: 'none',
						color: 'inherit',
						h2: {
							fontWeight: '700',
							letterSpacing: '-0.025em',
							marginTop: '3rem',
							marginBottom: '1.5rem',
						},
						h3: {
							fontWeight: '600',
							letterSpacing: '-0.025em',
							marginTop: '2rem',
							marginBottom: '1rem',
						},
						p: {
							marginTop: '1rem',
							marginBottom: '1rem',
						},
						strong: {
							fontWeight: '600',
							color: 'inherit',
						},
						a: {
							color: 'hsl(var(--primary))',
							textDecoration: 'none',
							'&:hover': {
								textDecoration: 'underline',
							},
						},
					},
				},
			},
		}
	},
	plugins: [],
} satisfies Config;
