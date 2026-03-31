

## Probleem

De screenshot toont duidelijk dat de order cards op mobile rechts worden afgekapt: de status badge ("Shipped") en het prijsbedrag ("EUR 23.7...") zijn niet volledig zichtbaar. Dit komt doordat de `ScrollArea` viewport geen expliciete breedte-beperking afdwingt, waardoor de card-inhoud breder wordt dan het scherm.

## Oorzaak

De `ScrollArea` component (Radix) rendert een viewport `div` met `w-full`, maar zonder `overflow-x-hidden` op de viewport zelf. In combinatie met de `min-w-0` en `overflow-hidden` op de containers erboven, wordt de breedte niet correct doorgegeven aan de kinderen. De cards nemen meer ruimte in dan beschikbaar.

## Oplossing

Wijzigingen in **`src/pages/DiscogsMessages.tsx`**:

1. **ScrollArea wrapper**: Voeg `w-full` toe aan de `ScrollArea` en wrap de kaarten in een container met expliciete `pr-1` (ruimte voor scrollbar) en `w-full overflow-hidden`.

2. **Cards breedte forceren**: Voeg `w-full max-w-full` toe aan elke `Card` zodat ze nooit breder worden dan hun parent.

3. **Outer container**: Verander de outer wrapper van `overflow-x-hidden` (CSS) naar `overflow-hidden` en voeg `max-w-[100vw]` toe om viewport-overflow volledig te voorkomen.

4. **Badge max-width verkleinen**: Verklein `max-w-[50%]` naar `max-w-[40%]` op de status badge zodat er altijd ruimte overblijft.

### Concrete wijzigingen

```
Regel 207: overflow-x-hidden → overflow-hidden, voeg box-border toe
Regel 254: voeg w-full toe aan flex container  
Regel 255: ScrollArea → className="flex-1 w-full"
Regel 256: space-y-2 → space-y-2 w-full pr-1
Regel 258-261: Card → voeg w-full max-w-full toe
Regel 270: max-w-[50%] → max-w-[40%]
```

Dit zorgt ervoor dat elke laag in de DOM-boom een expliciete breedte-beperking heeft, zodat de cards niet kunnen uitlopen.

