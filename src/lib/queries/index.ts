// queries/index.ts — Barrel export cho tất cả GROQ query
// Nguồn: 01-CONTENT_MODEL.md §1 (14 entity)

// B8.5.1 — Nền móng
export { categoryByTermCodeQuery, categoryBySlugQuery, categoriesBySetQuery } from './category'
export { personBySlugQuery, allPersonsQuery, articlesByPersonQuery } from './person'
export { touristDestinationBySlugQuery } from './touristDestination'
export { placeBySlugQuery, allPlacesQuery, placesContainedInQuery, nearbyForPlaceQuery } from './place'

// B8.5.2 — Entity phức tạp
export { attractionBySlugQuery, allAttractionsQuery, nearbyAttractionsQuery } from './attraction'
export { experienceBySlugQuery, experiencesByVenueQuery, allExperiencesQuery, experiencesByTypeQuery, nearbyExperiencesQuery } from './experience'
export { restaurantBySlugQuery, allRestaurantsQuery, restaurantsBySpecialtyQuery, nearbyRestaurantsQuery } from './restaurant'
export { specialtyBySlugQuery, allSpecialtiesQuery, nearbyForSpecialtyQuery } from './specialty'
export { siteSettingsQuery } from './siteSettings'

// B8.5.3 — Lưu trú + Vận hành + Nội dung
export { hotelBySlugQuery, allHotelsQuery, nearbyHotelsQuery } from './hotel'
export { resortBySlugQuery, allResortsQuery, nearbyResortsQuery } from './resort'
export { tourBySlugQuery, allToursQuery, toursByTypeQuery, nearbyToursQuery } from './tour'
export { organizationBySlugQuery, allOrganizationsQuery, nearbyForOrganizationQuery } from './organization'
export { eventBySlugQuery, allEventsQuery, nearbyEventsQuery } from './event'
export { articleBySlugQuery, allArticlesQuery, relatedArticlesQuery, nearbyArticlesQuery } from './article'

// Fragments
export {
  baseFieldsFragment, baseDocFieldsFragment,
  mainImageFragment, galleryFragment,
  faqFragment, highlightsFragment,
  entityRefFragment, openingHoursFragment,
  bodyFragment, imageProvenanceFragment,
  keyFactsFragment, accessInfoFragment, safetyNoteFragment,
  seasonNoteFragment, departureNoteFragment, originNoteFragment,
  seasonFragment, includesFragment, excludesFragment,
  touristTypeFragment, amenityFeatureFragment,
  onSiteActivitiesFragment, licenseInfoFragment,
  beachAccessFragment, servesCuisineFragment
} from './fragments'

// Types
export type {
  CategoryResult, PersonResult, TouristDestinationResult, PlaceResult,
  AttractionResult, ExperienceResult, RestaurantResult, SpecialtyResult,
  HotelResult, ResortResult, TourResult, OrganizationResult,
  EventResult, ArticleResult,
  TourStop, EntityRef, FAQItem, NearbyEntity, ImageAsset, GeoPoint,
  SiteSettingsResult, PickupPoint
} from '../types'
