require 'rubygems'
require 'dm-core'
require 'dm-migrations'
require 'dm-sqlite-adapter'


DataMapper::Logger.new($stdout, :debug)

#DataMapper.setup(:default, 'sqlite::memory:')
DataMapper::setup(:default, "sqlite3://#{Dir.pwd}/jfs.db")

class Blob
  include DataMapper::Resource
  property :id, Serial
  property :name, String, required: true
  property :size, Integer, limit: 8, required: true
  property :mime, String
  property :extension, String
  property :digest, String, required: true, length: 40
  property :created_at, DateTime, required: true, default: 'CURRENT_TIMESTAMP'
  property :updated_at, DateTime, required: true, default: 'CURRENT_TIMESTAMP'
end

# class Tree
#   include DataMapper::Resource
#   property :id, Serial
#   property :name, String, required: true
#   property :parent_id, default: 0, required: true
# end

DataMapper.finalize

DataMapper.auto_upgrade!
