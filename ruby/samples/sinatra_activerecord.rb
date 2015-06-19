require 'rubygems'
require 'sinatra'
require 'active_record'

ActiveRecord::Base.logger = Logger.new(STDOUT)
ActiveRecord::Base.establish_connection(
  adapter: 'sqlite3',
#  database: "#{Dir.pwd}/blog.db"
  database: ':memory:'
)

# ActiveRecord::Migrator.up 'db/migrate'
#
# ActiveRecord::Schema.define do
#   self.verbose = true
#
#   unless ActiveRecord::Base.connection.tables.include? 'posts'
#     create_table :posts do |t|
#       t.column :title,  :string
#       t.column :body,   :text
#       t.timestamps
#     end
#   end
#
#   unless ActiveRecord::Base.connection.tables.include? 'comments'
#     create_table :comments do |t|
#       t.column :posted_by,  :string
#       t.column :email,      :string
#       t.column :body,       :text
#       t.timestamps
#     end
#   end
# end

class InitialSchema < ActiveRecord::Migration
  def self.up
    create_table :posts do |t|
      t.column :title,  :string
      t.column :body,   :text
      t.timestamps
    end
    create_table :comments do |t|
      t.column :posted_by,  :string
      t.column :email,      :string
      t.column :body,       :text
      t.timestamps
    end
  end

  def self.down
    drop_table :posts
    drop_table :comments
  end
end

InitialSchema.migrate(:up)


#Now you can create and use ActiveRecord models just like in Rails (the example assumes you already have a 'posts' table in your database):
class Post < ActiveRecord::Base
end

post = Post.new
post.title = 'First Blog'
post.body = 'Hello World!'
post.save

Post.create(
    title: 'Second Blog',
    body: 'A lot of text ...'
)


get '/' do
  @posts = Post.all()
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
    <td><%= post.id %></td>
    <td><%= post.title %></td>
    <td><%= post.body %></td>
    <td><%= post.created_at %></td>
  </tr>
  <% end %>
</table>
</div>