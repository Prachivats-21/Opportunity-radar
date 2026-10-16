import React from 'react'
import { Trophy, GraduationCap, Flame, Award, ArrowUpRight } from 'lucide-react'

interface CategoryExploreProps {
  counts: {
    Hackathon: number
    Internship: number
    Competition: number
    Fellowship: number
  }
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export const CategoryExplore: React.FC<CategoryExploreProps> = ({
  counts,
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    {
      id: 'Hackathon',
      title: 'Hackathons',
      desc: 'Build working prototypes and solve challenges with teammates.',
      icon: <Trophy size={18} />,
      classSuffix: 'hackathons',
      count: counts.Hackathon || 0,
    },
    {
      id: 'Internship',
      title: 'Internships',
      desc: 'Gain practical experience on government and industry initiatives.',
      icon: <GraduationCap size={18} />,
      classSuffix: 'internships',
      count: counts.Internship || 0,
    },
    {
      id: 'Competition',
      title: 'Competitions',
      desc: 'Test your problem-solving against state and national peers.',
      icon: <Flame size={18} />,
      classSuffix: 'competitions',
      count: counts.Competition || 0,
    },
    {
      id: 'Fellowship',
      title: 'Fellowships',
      desc: 'Structured cohorts, research mentorship, and student grants.',
      icon: <Award size={18} />,
      classSuffix: 'fellowships',
      count: counts.Fellowship || 0,
    },
  ]

  const handleCardClick = (catId: string) => {
    onSelectCategory(catId === selectedCategory ? 'All' : catId)
    // Scroll smoothly to opportunity list
    const el = document.getElementById('opportunity-feed')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="category-section">
      <div className="section-title-row">
        <h2 className="section-heading-serif">Explore by Track</h2>
        <span className="section-subtext">Verified signals across student domains</span>
      </div>

      <div className="category-grid">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              className={`category-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCardClick(cat.id)}
              aria-label={`Filter by ${cat.title}`}
            >
              <div className={`cat-icon-wrap ${cat.classSuffix}`}>
                {cat.icon}
              </div>
              <h3 className="cat-card-title">{cat.title}</h3>
              <p className="cat-card-desc">{cat.desc}</p>
              <div className="cat-card-footer">
                <span>{cat.count} verified {cat.count === 1 ? 'listing' : 'listings'}</span>
                <ArrowUpRight size={14} style={{ opacity: isSelected ? 1 : 0.6 }} />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
