
<figure class="torrent-card__figure">
<img
class="torrent-card__image"
@switch (true)
    @case ($torrent->category->movie_meta || $torrent->category->tv_meta)
        src="{{ isset($meta->poster) ? tmdb_image('poster_mid', $meta->poster) : 'https://via.placeholder.com/160x240' }}"
        @break
    @case ($torrent->category->game_meta && isset($torrent->meta) && $meta->cover->image_id && $meta->name)
        src="https://images.igdb.com/igdb/image/upload/t_cover_big/{{ $torrent->meta->cover->image_id }}.jpg"
        @break
    @case ($torrent->category->music_meta)
        src="https://via.placeholder.com/160x240"
        @break
    @case ($torrent->category->no_meta && file_exists(public_path().'/files/img/torrent-cover_'.$torrent->id.'.jpg'))
        src="{{ url('files/img/torrent-cover_'.$torrent->id.'.jpg') }}"
        @break
@endswitch
alt="{{ __('torrent.poster') }}"
/>
</figure>

