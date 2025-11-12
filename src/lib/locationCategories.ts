export type LocationCategory = {
  value: string;
  label: string;
};

export const LOCATION_CATEGORIES: LocationCategory[] = [
  // Food & Drink
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Café" },
  { value: "bakery", label: "Bakery" },
  { value: "fast_food", label: "Fast Food" },
  { value: "food_truck", label: "Food Truck" },
  { value: "ice_cream", label: "Ice Cream" },
  { value: "brewery", label: "Brewery" },
  { value: "winery", label: "Winery" },
  { value: "distillery", label: "Distillery" },
  { value: "food_market", label: "Food Market" },
  { value: "grocery_store", label: "Grocery Store" },
  
  // Entertainment & Culture
  { value: "museum", label: "Museum" },
  { value: "gallery", label: "Gallery" },
  { value: "theater", label: "Theater" },
  { value: "cinema", label: "Cinema" },
  { value: "concert_hall", label: "Concert Hall" },
  { value: "music_venue", label: "Music Venue" },
  { value: "nightclub", label: "Nightclub" },
  { value: "comedy_club", label: "Comedy Club" },
  { value: "library", label: "Library" },
  { value: "bookstore", label: "Bookstore" },
  { value: "arcade", label: "Arcade" },
  { value: "bowling", label: "Bowling" },
  { value: "escape_room", label: "Escape Room" },
  
  // Outdoor & Nature
  { value: "park", label: "Park" },
  { value: "beach", label: "Beach" },
  { value: "mountain", label: "Mountain" },
  { value: "trail", label: "Trail" },
  { value: "campground", label: "Campground" },
  { value: "hiking", label: "Hiking Spot" },
  { value: "viewpoint", label: "Viewpoint" },
  { value: "garden", label: "Garden" },
  { value: "zoo", label: "Zoo" },
  { value: "aquarium", label: "Aquarium" },
  { value: "botanical_garden", label: "Botanical Garden" },
  { value: "nature_reserve", label: "Nature Reserve" },
  
  // Shopping
  { value: "shopping_mall", label: "Shopping Mall" },
  { value: "store", label: "Store" },
  { value: "boutique", label: "Boutique" },
  { value: "market", label: "Market" },
  { value: "flea_market", label: "Flea Market" },
  { value: "antique_shop", label: "Antique Shop" },
  { value: "souvenir_shop", label: "Souvenir Shop" },
  
  // Accommodation
  { value: "hotel", label: "Hotel" },
  { value: "hostel", label: "Hostel" },
  { value: "bed_breakfast", label: "Bed & Breakfast" },
  { value: "resort", label: "Resort" },
  { value: "apartment", label: "Apartment" },
  { value: "cabin", label: "Cabin" },
  
  // Services
  { value: "hospital", label: "Hospital" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "clinic", label: "Clinic" },
  { value: "bank", label: "Bank" },
  { value: "atm", label: "ATM" },
  { value: "post_office", label: "Post Office" },
  { value: "gas_station", label: "Gas Station" },
  { value: "car_rental", label: "Car Rental" },
  { value: "parking", label: "Parking" },
  { value: "laundry", label: "Laundry" },
  { value: "hair_salon", label: "Hair Salon" },
  { value: "spa", label: "Spa" },
  
  // Transportation
  { value: "airport", label: "Airport" },
  { value: "train_station", label: "Train Station" },
  { value: "bus_station", label: "Bus Station" },
  { value: "subway_station", label: "Subway Station" },
  { value: "ferry_terminal", label: "Ferry Terminal" },
  { value: "taxi_stand", label: "Taxi Stand" },
  { value: "bike_rental", label: "Bike Rental" },
  
  // Education
  { value: "school", label: "School" },
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "language_school", label: "Language School" },
  
  // Sports & Recreation
  { value: "gym", label: "Gym" },
  { value: "stadium", label: "Stadium" },
  { value: "sports_complex", label: "Sports Complex" },
  { value: "swimming_pool", label: "Swimming Pool" },
  { value: "tennis_court", label: "Tennis Court" },
  { value: "golf_course", label: "Golf Course" },
  { value: "skating_rink", label: "Skating Rink" },
  { value: "climbing_gym", label: "Climbing Gym" },
  
  // Religious & Spiritual
  { value: "church", label: "Church" },
  { value: "temple", label: "Temple" },
  { value: "mosque", label: "Mosque" },
  { value: "synagogue", label: "Synagogue" },
  { value: "shrine", label: "Shrine" },
  
  // Attractions & Landmarks
  { value: "attraction", label: "Attraction" },
  { value: "monument", label: "Monument" },
  { value: "landmark", label: "Landmark" },
  { value: "castle", label: "Castle" },
  { value: "bridge", label: "Bridge" },
  { value: "tower", label: "Tower" },
  { value: "plaza", label: "Plaza" },
  { value: "square", label: "Square" },
  { value: "fountain", label: "Fountain" },
  { value: "statue", label: "Statue" },
  
  // Other
  { value: "other", label: "Other" },
];

export const getCategoryLabel = (value: string | null | undefined): string => {
  if (!value) return "Other";
  const category = LOCATION_CATEGORIES.find((cat) => cat.value === value);
  return category?.label ?? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
};

export const getCategoryValue = (label: string | null | undefined): string | null => {
  if (!label) return null;
  const category = LOCATION_CATEGORIES.find((cat) => cat.label.toLowerCase() === label.toLowerCase());
  return category?.value ?? null;
};

