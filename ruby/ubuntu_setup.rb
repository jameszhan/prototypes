require 'sshkit'
require 'sshkit/dsl'

SSHKit.config.format = :pretty
SSHKit.config.output_verbosity = :debug

# 设置远程登陆面输入密码
# cat ~/.ssh/id_rsa.pub | ssh james@10.211.55.5 'cat >> ~/.ssh/authorized_keys'
# 使用root用户执行: `echo 'deploy ALL = (ALL) NOPASSWD: ALL' > /etc/sudoers.d/deploy`
# ruby ubuntu_setup.rb 10.211.55.5 deploy PASSWD

host = ARGV[0]
user = ARGV[1]
password = ARGV[2]

passwd_handler = lambda do|ch, state, data|
  if state == :stderr
    $stderr.print(data)
    if data =~ /password/i
      ch.send_data("#{password}\n")
    end
  else
    $stdout.print(data)
  end
end

on "root@#{host}", in: :sequence, wait: 5 do
  if test "[ -d /home/#{user} ]"
    puts "User #{user} is ready!"
  else
    execute "deluser #{user} --remove-all-files"
    puts "Not Found User #{user}, start setup user #{user}"
    execute "adduser --ingroup sudo --shell /bin/bash --disabled-password --gecos 'User for managing of deployment' --quiet --home /home/#{user} #{user}"
    execute "echo '#{user} ALL = (ALL) NOPASSWD: ALL' > /tmp/sudoer_#{user}"
    execute "mv /tmp/sudoer_#{user} /etc/sudoers.d/#{user}"
    execute "chown -R root:root /etc/sudoers.d/#{user}"

    if test "[ -d /home/#{user}/.ssh ]"
      puts "/home/#{user}/.ssh have already exists."
    else
      puts "/home/#{user}/.ssh not exists, create one."
      execute "mkdir /home/#{user}/.ssh"
      execute "chown -R #{user}:sudo /home/#{user}/.ssh"
    end

    upload! '/Users/james/.ssh/id_rsa.pub', '/tmp/id_rsa.pub'
    execute "cat /tmp/id_rsa.pub >> /home/#{user}/.ssh/authorized_keys"

    with_ssh do |ssh|
      ch = ssh.exec("passwd #{user}", &passwd_handler)
      ch.wait
    end
  end
  if test '[ -f /etc/apt/sources.list_bak ]'
    puts 'The mirrors sources list have already setup!'
  else
    capture :mv, '/etc/apt/sources.list /etc/apt/sources.list_bak'
    contents = StringIO.new <<-SOURCE_CONTENT
deb http://mirrors.aliyun.com/ubuntu/ utopic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ utopic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ utopic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ utopic-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ utopic-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ utopic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ utopic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ utopic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ utopic-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ utopic-backports main restricted universe multiverse
    SOURCE_CONTENT
    upload! contents, '/etc/apt/sources.list'
  end
end

# Setup Oh-My-Zsh
on "#{user}@#{host}", in: :sequence, wait: 5 do
  capture :sudo, 'apt-get -y update'
  capture :sudo, 'apt-get -y install python-software-properties'
  capture :sudo, 'apt-get -y upgrade'
  capture :sudo, 'apt-get -y dist-upgrade'

  oh_my_zsh_dir = "/home/#{user}/.oh-my-zsh"
  if test "[ -d #{oh_my_zsh_dir} ]"
    within oh_my_zsh_dir do
      execute :git, :pull
      execute :git, :fetch, :upstream
      execute :git, :checkout, :master
      execute :git, :rebase, 'upstream/master'
    end
  else
    capture :sudo, 'apt-get -y install git' unless test('command -v git')
    execute :git, :config, '--global user.name "James Zhan"'
    execute :git, :config, '--global user.email "zhiqiangzhan@gmail.com"'
    execute :git, :clone, 'https://github.com/jameszhan/oh-my-zsh.git', oh_my_zsh_dir

    within oh_my_zsh_dir do
      execute :git, :remote, :add, :upstream, 'https://github.com/robbyrussell/oh-my-zsh.git'
      execute :git, :pull, :origin, :master
      capture :cp, 'templates/zshrc.zsh-template', '../.zshrc'
    end

    capture :sudo, 'apt-get -y install zsh' unless test('command -v zsh')
  end

  with_ssh do |ssh|
    ch = ssh.exec('chsh -s `which zsh`', &passwd_handler)
    ch.wait
  end unless capture('echo $SHELL') =~ /zsh$/
end

#Setup Ruby
on "#{user}@#{host}", in: :sequence, wait: 5 do
  #Install rbenv
  within '/usr/local' do
    if test '[ -d /usr/local/rbenv ]'
      within 'rbenv' do
        execute :git, :pull
      end
    else
      execute :sudo, :git, :clone, 'https://github.com/sstephenson/rbenv.git rbenv'
      execute :sudo, 'chown -R deploy:sudo rbenv'
    end

    within 'rbenv' do
      if test '[ -d /usr/local/rbenv/plugins/ruby-build ]'
        within 'plugins/ruby-build' do
          execute :git, :pull
        end
      else
        execute :git, :clone, 'https://github.com/sstephenson/ruby-build.git plugins/ruby-build'
      end
    end

    if test '[ -f /etc/profile.d/rbenv.sh ]'
      puts 'rbenv.sh have already setup!'
    else
      rbenv_scripts = StringIO.new <<-SOURCE_CONTENT
# rbenv setup
export RBENV_ROOT=/usr/local/rbenv
export PATH="$RBENV_ROOT/bin:$PATH"
eval "$(rbenv init -)"
      SOURCE_CONTENT
      upload! rbenv_scripts, '/tmp/rbenv_scripts'
      execute 'chmod +x /tmp/rbenv_scripts'
      execute :sudo, :mv, '/tmp/rbenv_scripts', '/etc/profile.d/rbenv.sh' if test('[ -f /tmp/rbenv_scripts ]')
      execute 'echo "source /etc/profile.d/rbenv.sh" >> ~/.zshrc'
    end
  end

  unless test('source /etc/profile.d/rbenv.sh && ruby --version')
    execute :sudo, 'apt-get -y install autoconf bison build-essential libssl-dev libyaml-dev libreadline6-dev zlib1g-dev libncurses5-dev libffi-dev libgdbm3 libgdbm-dev'
    execute <<-ZSHRC
        source /etc/profile.d/rbenv.sh
        rbenv install --verbose 2.2.2
        rbenv global 2.2.2
        rbenv rehash
        gem install bundler
    ZSHRC
  end
end

# Setup Others
on "#{user}@#{host}", in: :sequence, wait: 5 do
  # nginx
  unless test('type nginx')
    execute :sudo, 'add-apt-repository ppa:nginx/stable'
    execute :sudo, 'apt-get -y update'
    execute :sudo, 'apt-get install nginx'
  end

  #docker
  execute :sudo, 'apt-get -y update'
  execute :sudo, 'apt-get -y install wget' unless test('type wget')
  with_ssh do |ssh|
    ch = ssh.exec('wget -qO- https://get.docker.com/ | sh', &passwd_handler)
    ch.wait
  end unless test('type docker')
end


