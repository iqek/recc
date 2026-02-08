from .unified_schema import MediaItem

class BookProcessor:
    """Convert Google Books API data to unified format"""
    
    @staticmethod
    def process_book(raw_data: dict) -> MediaItem:
        vol_info = raw_data.get('volumeInfo', {})
        
        # Extract year from published date
        year = None
        pub_date = vol_info.get('publishedDate', '')
        if len(pub_date) >= 4:
            year = int(pub_date[:4])
        
        rating = None
        if 'averageRating' in vol_info:
            rating = vol_info['averageRating'] * 2  # convert to 0-10
        
        return MediaItem(
            id=f"book_{raw_data['id']}",
            title=vol_info.get('title', 'Unknown'),
            media_type='book',
            genres=vol_info.get('categories', []),
            tags=[],  # isn't provided
            description=vol_info.get('description', ''),
            year=year,
            rating=rating,
            metadata={
                'authors': vol_info.get('authors', []),
                'publisher': vol_info.get('publisher'),
                'page_count': vol_info.get('pageCount'),
                'language': vol_info.get('language')
            }
        )