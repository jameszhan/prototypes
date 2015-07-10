require 'rubygems'
require 'sinatra'
require 'dm-core'
require 'dm-migrations'

DataMapper::Logger.new($stdout, :debug)

# need install dm-sqlite-adapter
DataMapper.setup(:default, 'sqlite::memory:')
#DataMapper::setup(:default, "sqlite3://#{Dir.pwd}/blog.db")

class Post
  include DataMapper::Resource
  property :id, Serial                                                  # An auto-increment integer key
  property :title, String                                               # A varchar type string, for short strings
  property :body, Text                                                  # A text block, for longer string data.
  property :created_at, DateTime, default: lambda{|resource, props| Time.now }          # A DateTime, for any date you might like.

  has n, :comments

  has n, :categorizations
  has n, :categories, :through => :categorizations
end

class Comment
  include DataMapper::Resource

  property :id,         Serial
  property :posted_by,  String
  property :email,      String
  property :url,        String
  property :body,       Text

  belongs_to :post
end

class Category
  include DataMapper::Resource

  property :id,         Serial
  property :name,       String

  has n, :categorizations
  has n, :posts,      :through => :categorizations
end

class Categorization
  include DataMapper::Resource

  property :id,         Serial
  property :created_at, DateTime, default: 'CURRENT_TIMESTAMP'

  belongs_to :category
  belongs_to :post
end

DataMapper.finalize

# Both methods are used to generate schema in the datastores that matches your model definition. However,
# auto_migrate destructively drops and recreates tables to match your model definitions and
# auto_upgrade! supports upgrading your datastore to match your model definitions, without actually destroying any already existing data.
#DataMapper.auto_migrate!
DataMapper.auto_upgrade!

post = Post.new
post.title = 'First Blog'
post.body = 'Hello World!'
post.save

Post.create(
  title: 'Second Blog',
  body: 'A lot of text ...'
)


get '/' do
  # get the latest 20 posts
  @posts = Post.all(:order => [ :id.desc ], :limit => 20)
  erb :index
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