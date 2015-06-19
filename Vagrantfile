# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT

echo  ========= Install node ========

 sudo apt-get update
 sudo apt-get install -y npm
 sudo npm cache clean -f
 sudo npm install -g n
 sudo n stable

 echo  ========= Install node plugins ========

 sudo npm install -g nodemon
 sudo npm install -g gulp
 sudo npm install -g bower
 sudo npm install -g mocha

 echo  ========= Install mongo ========

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu/ "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list 
sudo apt-get update
sudo apt-get install -y mongodb-org

echo  ========= Install git ========

sudo apt-get install -y git

echo echo  ========= Install redis ========

sudo apt-get install -y redis-server 

echo  ========= Install appgyver ========

sudo chown -R `whoami` /usr/local/lib/node_modules
[-e ~/.npm] && sudo chown -R `whoami` ~/.npm
sudo chown -R `whoami` $NPM_BIN_DIR
npm install steroids -g
#sudo apt-get install -y apache2
SCRIPT

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://atlas.hashicorp.com/search.
  config.vm.box = "trusty64"

  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  config.vm.box_url = "https://cloud-images.ubuntu.com/vagrant/trusty/trusty-server-cloudimg-amd64-juju-vagrant-disk1.box"

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # config.vm.network "forwarded_port", guest: 80, host: 8080

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.33.10"
  config.vm.network :forwarded_port, host: 8080, guest: 80
  config.vm.network :forwarded_port, host: 13303, guest: 13303
  config.vm.network :forwarded_port, host: 3333, guest: 3333

  config.vm.network :forwarded_port, host: 4567, guest: 4567

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  # config.vm.synced_folder "../data", "/vagrant_data"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #


  #config.vm.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]


  config.vm.provider "virtualbox" do |v|

    #v.gui = true
    #config.vm.synced_folder ".", "/vagrant", type: "smb"

    v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/vagrant", "1"]

  end

  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Define a Vagrant Push strategy for pushing to Atlas. Other push strategies
  # such as FTP and Heroku are also available. See the documentation at
  # https://docs.vagrantup.com/v2/push/atlas.html for more information.
  # config.push.define "atlas" do |push|
  #   push.app = "YOUR_ATLAS_USERNAME/YOUR_APPLICATION_NAME"
  # end


  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
    config.vm.provision "shell", inline: $script

end

#The fix…
#Scroll down through the thread until you get to the fix by chernetsov0 and #celtric. Your installation may vary, but this worked for me. In the file: C:\Has#hiCorp\Vagrant\embedded\gems\gems\vagrant-1.7.2\plugins\providers\virtualbox\dri#ver\version_4_3.rb between lines 495-510. Replace the line folder[:hostpath] #with '\\\\?\\' + folder[:hostpath].gsub(/[\/\\]/,'\\')]. The explanation of #what it’s doing is in the github link.

#Use following command: npm install --no-bin-link