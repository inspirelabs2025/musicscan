import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Clock, Star, Award, Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Dutch music history milestones
const DUTCH_MUSIC_MILESTONES = [
  {
    year: 1969,
    title: "Shocking Blue's Venus",
    description: "Venus wordt de eerste Nederlandse single die #1 bereikt in de Amerikaanse Billboard Hot 100.",
    icon: Star,
    category: "Internationaal succes"
  },
  {
    year: 1973,
    title: "Golden Earring - Radar Love",
    description: "Radar Love wordt een wereldwijde hit en een van de meest gedraaide rocknummers ooit.",
    icon: Music2,
    category: "Rockklassieker"
  },
  {
    year: 1982,
    title: "Doe Maar Mania",
    description: "Doe Maar domineert de Nederlandse hitlijsten met albums als 'Doris Day' en 'Skunk'.",
    icon: Award,
    category: "Nederpop"
  },
  {
    year: 1997,
    title: "Within Temptation opgericht",
    description: "Sharon den Adel en Robert Westerholt starten de band die symphonic metal naar Nederland brengt.",
    icon: Star,
    category: "Symphonic Metal"
  },
  {
    year: 2001,
    title: "Tiësto's werelddominantie",
    description: "Tiësto wordt uitgeroepen tot beste DJ ter wereld en zet Nederland op de kaart als EDM-grootmacht.",
    icon: Award,
    category: "Electronic"
  },
  {
    year: 2013,
    title: "Martin Garrix - Animals",
    description: "De toen 17-jarige Martin Garrix scoort een wereldwijde #1 hit met Animals.",
    icon: Star,
    category: "EDM"
  },
];

export function NederlandseMuziekGeschiedenis() {
  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nederlandse{" "}
            <span className="text-[hsl(0,84%,40%)]">Muziekgeschiedenis</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Belangrijke momenten die de Nederlandse muziekscene hebben gevormd
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(24,100%,50%)] via-white to-[hsl(211,100%,35%)] transform md:-translate-x-1/2" />

          {DUTCH_MUSIC_MILESTONES.map((milestone, index) => (
            <motion.div
              key={milestone.year}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative flex flex-col md:flex-row gap-4 mb-8 ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-[hsl(24,100%,50%)] rounded-full border-4 border-background transform md:-translate-x-1/2 z-10" />

              {/* Content card */}
              <div className={`ml-8 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[hsl(24,100%,50%)]/30">
                  <div className={`flex items-center gap-2 mb-2 ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                    <Badge variant="outline" className="bg-[hsl(24,100%,50%)]/10 border-[hsl(24,100%,50%)]">
                      {milestone.category}
                    </Badge>
                  </div>
                  
                  <div className={`flex items-center gap-2 mb-2 ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                    <span className="text-3xl font-bold text-[hsl(24,100%,50%)]">
                      {milestone.year}
                    </span>
                    <milestone.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground text-sm">{milestone.description}</p>
                </Card>
              </div>

              {/* Spacer for opposite side */}
              <div className="hidden md:block md:w-1/2" />
            </motion.div>
          ))}
        </div>

        {/* Link to full music history */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(211,100%,35%)] hover:opacity-90">
            <Link to="/vandaag-in-de-muziekgeschiedenis" className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bekijk vandaag in de muziekgeschiedenis
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
