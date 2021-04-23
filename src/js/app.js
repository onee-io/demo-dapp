App = {
  web3Provider: null,
  contracts: {},
  account: null,

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // 初始化 web3
    App.linkWallet();
    return App.initContract();
  },

  initContract: function() {
    // 初始化合约
    $.getJSON('Adoption.json', function(data) {
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      App.contracts.Adoption.setProvider(App.web3Provider);
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '#linkWallet', App.linkWallet);
  },

  markAdopted: function() {
    var adoptionInstance;
    App.contracts.Adoption.deployed().then(function(instance) {
      // 获取已部署的合约实例
      adoptionInstance = instance;
      // 调用合约的 getAdopters 方法
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        // 领养列表对应的位置不为0 标记已领养并不可点击
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    if (App.account == null) {
      App.linkWallet();
      return;
    }

    var petId = parseInt($(event.target).data('id'));
    // 获取已部署的合约实例
    App.contracts.Adoption.deployed().then(function(instance) {
      // 发起领养方法 adopt 调用
      return instance.adopt(petId, { from: App.account });
    }).then(function (result) {
      // 领养后更新页面领养状态
      return App.markAdopted();
    }).catch(function(err) {
      console.log(err.message);
    });

    // 以下方式也可以获取钱包地址
    // web3.eth.getAccounts(function(error, accounts) {
    //   // 获取合约账户
    //   var account = accounts[0];
    // });
  },

  linkWallet: function(event) {
    if (window.ethereum) {
      // 连接 metamask 钱包
      App.web3Provider = window.ethereum;
      try {
        // 请求用户授权
        window.ethereum.request({ 
          method: 'eth_requestAccounts'
        }).then(function(accounts) {
          App.account = accounts[0];
        });
      } catch (error) {
        if (error.code === 4001) {
          // 用户不授权时
          console.error("User denied account access")
        }
      }
    } else {
      alert('请安装MetaMask插件并解锁您的以太坊账户');
    }

    // 连接本地
    // if (typeof web3 !== 'undefined') {
    //   App.web3Provider = web3.currentProvider;
    // } else {
    //   App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
    // }
    web3 = new Web3(App.web3Provider);
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
