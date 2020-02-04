
const socket = io();
const constructor = document.getElementById('constructor');
const table = document.getElementById('table');
const finder = document.getElementById('finder');


function getData(props){
    socket.emit('dataRequest', props);
}

socket.on('dataResponse', function(data){

    if(table.dataset.class != data.tableName){
        table.dataset.class = data.tableName;
        let tHead = '';
        for(key in data.data[0]){
            if (key == 'name'){
                tHead = tHead + `<td id='module-name'>
                <input id="input" placeholder="${key}" type="text"/>
                </td>`
            }
            else if (key == 'mark'){
                tHead = tHead + `<td id="mark" data-value="${data.tableName}" data-queue="1" data-sort="mark">${key}</td>`;
            }else{
                tHead = tHead + `<td>${key}</td>`;
            }
        }
        $('thead').html(`<tr>${tHead}<td id="next" onclick="getData({value: '${data.tableName}', queue: 'next'})">></td></tr>`);
    }

    let template = $(`#${data.tableName}`).html();
    let html = Mustache.to_html(template, data);
    $('#items').html(html);

    if(table.dataset.class != "motherboards"){
        document.getElementById('mark').addEventListener('click', function(event){
            getData(event.target.dataset)
        })
    }
    const input = document.getElementById('input');
    input.oninput = function(){
        if(input.value.length > 2 && input.value.length < 13 ){
            socket.emit('nameMatching', {inputValue: input.value, tableName: table.dataset.class})
        }
    }
})

document.getElementById('header').addEventListener('click', function(event){
    if(event.target.className == 'nav-link'){
        getData(event.target.dataset)
    }
})

//DROPDAWN COLLAPSE
document.getElementById('dropdawn').addEventListener('mouseover', function(event){
    finder.classList.add('display-flex')
})
document.getElementById('dropdawn').addEventListener('mouseleave', function(event){
    finder.classList.remove('display-flex')
})
finder.addEventListener('click', function(event){
    finder.classList.remove('display-flex')
})
//DROPDAWN COLLAPSE


//----CONSTRUCTOR----//START
//----ADD ITEM TO CONSTRUCTOR----//START
table.addEventListener('click', function(event){
    event.target.className == 'add' ? addModule(event.target.dataset) : null;
})
function addModule(props) {
    constructor.dataset.blocker.includes(props.code) ? null : socket.emit('constructorRequest', props);
}
socket.on('constructorResponse', function (props){
    let div = `<div class="cItem" data-code="${props.code}"><span>${props.name}</span><span onclick="dlt(event)"><i class="fas fa-times"/></span></div>`;
    document.getElementById('cBody').insertAdjacentHTML("afterbegin", div);
    constructor.dataset.blocker += props.code;
})

document.getElementById('found-modules').addEventListener('click', function(event){
    let target = event.target.closest('div')
    target.className == 'found-item' ? addModule(target.dataset) : null;
})
//----ADD ITEM TO CONSTRUCTOR----//FINISH

//----REMOVE ITEM FROM CONSTRUCTOR----//START
function dlt(e){
    target_el = e.target.closest('div');
    new_blocker = constructor.dataset.blocker.replace(target_el.dataset.code, '');
    constructor.dataset.blocker = new_blocker;
    target_el.remove();
    socket.emit('constructorRequest', target_el.dataset.code)
}
//----REMOVE ITEM FROM CONSTRUCTOR----//FINISH

//----FIND MISSING ITEM----//START
document.getElementById('finder').addEventListener('click', function(event){
    if (constructor.dataset.blocker) {
        socket.emit('finderRequest', event.target.dataset.value)
    }else{
        console.log('Constructor is empty');
    }
})
socket.on('finderResponse', function(data){
    let template = $(`#found-${data.tableName}`).html();
    let html = Mustache.to_html(template, data);
    $('#found-modules').html(html);
})
//----FIND MISSING ITEM----//FINISH
//----CONSTRUCTOR----//FINISH
