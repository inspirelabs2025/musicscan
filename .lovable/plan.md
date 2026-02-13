
# Fix ArtShop Layout - Mobiel en Desktop

## Probleem
Door `space-y-0` op de container zitten alle secties (breadcrumb, categorie-navigatie, hero, filters, producten) direct tegen elkaar aan zonder enige ruimte. Dit ziet er rommelig uit, vooral op mobiel.

## Oplossing
Gecontroleerde spacing per sectie toepassen in plaats van een globale `space-y` class. Zo bepalen we precies hoeveel ruimte er tussen elke sectie zit.

## Technische wijzigingen

### 1. `src/pages/ArtShop.tsx`
- Verander `space-y-0` terug naar `space-y-4` voor nette maar compacte spacing tussen secties
- Voeg op mobiel kleinere top-padding toe: `py-4 md:py-8`
- Maak de hero sectie compacter op mobiel: kleinere padding (`p-5 md:p-12`), kleinere titel (`text-2xl md:text-5xl`), kleinere beschrijving (`text-base md:text-xl`)

### 2. `src/components/CategoryNavigation.tsx`
- Verwijder de "Kies je kunststijl" header (bespaart verticale ruimte)
- Gebruik `grid-cols-3` op mobiel ook (compacte horizontale cards) of `grid-cols-1` met minimale gap
- Maak cards compacter op mobiel: kleinere padding (`p-3 md:p-6`)
- Verberg het icoon op mobiel om ruimte te besparen

### Resultaat
- Nette, consistente 16px (1rem) spacing tussen alle secties
- Compactere hero en categorie-navigatie op mobiel
- Geen overlapping of visuele botsingen meer
- Alles sluit netjes op elkaar aan zonder tegen elkaar te plakken
