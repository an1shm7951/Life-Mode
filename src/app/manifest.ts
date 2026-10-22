import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'LifeMode',
    short_name: 'LifeMode',
    description:
      'Your personal workspace for student life, fitness, career, business, and personal growth.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0b0b0d',
    theme_color: '#0b0b0d',
    categories: ['productivity', 'lifestyle'],
  }
}
