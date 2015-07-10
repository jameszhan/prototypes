require './models'

BUF_SIZE = 1024 * 1024 * 1024

def digest(uri)
  #sha = Digest::SHA1.new
  sha = Digest::SHA256.new
  open(uri, 'rb') do|io|
    while(buf = io.read(BUF_SIZE))
      sha.update(buf)
    end
  end
  sha.hexdigest
end



def upsert_blob(path, basename, ext)
  stat = File.stat(path)
  hash = digest(path)
  blob = Blob.where(digest: path).take
  unless blob
    Blob.create(
      name: basename,
      mime: Mime.fetch()
    )
  else

  end
  if blob
    if blob.modified_at != stat.mtime
      logger.info "update file #{path}"
      blob.update(size: stat.size, modified_at: stat.mtime, digest: nil)
      DigestWorker.perform_async(blob.id)
    else
      logger.debug "ignore file #{path}"
    end
  else
    logger.info "load file #{path}"
    blob = Blob.create(
        name: basename,
        mime: Mime.fetch(ext[/\w+/]){|fallback| "unknown/#{fallback}" }.to_s,
        uri: path,
        extension: ext,
        size: stat.size,
        created_at: stat.ctime,
        modified_at: stat.mtime
    )
    DigestWorker.perform_async(blob.id)
  end
end


Find.find(dir) do|path|
  ext = File.extname(path).downcase
  basename = File.basename(path, ext)
  if File.directory?(path)
    if config['osx_formats'].include?(ext)
      upsert_blob(path, basename, ext)
      logger.info "prune osx file #{path}."
      Find.prune
    elsif basename[0] == ?.
      logger.info "ignore directory #{path}."
      Find.prune
    else
      next
    end
  elsif basename[0] == ?. || ext.empty? || config['ignore_extensions'].include?(ext)
    logger.debug "ignore file #{path}."
  elsif File.file?(path)
    upsert_blob(path, basename, ext)
  else
    logger.warn "unaccept path #{path}."
  end
end

__END__

@@layout
<html>
  <%= yield %>
</html>

@@index
<div>
<table>
  <% @posts.each do|post| %>
  <tr>
    <td><%= post.title %></td>
    <td><%= post.body %></td>
    <td><%= post.created_at %></td>
  </tr>
  <% end %>
</table>
</div>