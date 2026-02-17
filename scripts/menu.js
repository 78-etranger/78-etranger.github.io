(function(){
  var burger = document.querySelector('.burger');
  var circle = document.querySelector('.circle');
  var menu = document.querySelector('.menu');
  var menuItems = menu ? menu.querySelectorAll('li') : [];
  if(!burger || !menu) return;

  function openMenu(){
    circle.classList.add('expand');
    burger.classList.add('open');
    menu.classList.add('open');
    menuItems.forEach(function(li){ li.classList.add('animate'); });
  }

  function closeMenu(){
    // First remove animate so items fade out, then remove .open after transition
    menuItems.forEach(function(li){ li.classList.remove('animate'); });
    setTimeout(function(){
      burger.classList.remove('open');
      circle.classList.remove('expand');
      menu.classList.remove('open');
    }, 140); // match/just-after CSS transition (120ms)
  }

  ['click','touchstart'].forEach(function(ev){
    burger.addEventListener(ev, function(e){
      e.preventDefault();
      if(!burger.classList.contains('open')) openMenu(); else closeMenu();
    }, {passive:false});
  });

  // close when a menu link is activated
  menu.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a');
    if(a) { closeMenu(); }
  });
})();
