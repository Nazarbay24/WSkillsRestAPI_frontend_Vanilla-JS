document.getElementById('go-main').onclick = function() {
	document.getElementById('events-list').style.display = 'block';
	document.getElementById('detail-block').style.display = 'none';
	document.getElementById('session-detail').style.display = 'none';

	window.history.pushState(null, null, '?');
}

let logged;
let latest_event;
let registration_fetch = {
	ticket_id: false,
	session_ids: []
};




if (sessionStorage.getItem('user')) {
	logged = JSON.parse(sessionStorage.getItem('user'));

	document.getElementById('login_btn').style.display = 'none';
	document.getElementById('logout_btn').style.display = 'block';
	document.getElementById('user-name').textContent = logged.username;
	document.getElementById('login-wrapper').style.display = 'none';
}




fetch('http://nurbeklu.beget.tech/api/v1/events')
	.then(response => response.json())
	.then(data => showEvents(data));

let events;
let last_event_slug;
let last_organizer_slug;
let session_id;

function showEvents(data) {
	events = data;
	let events_list = document.getElementById('events-list');



	events.events.forEach(event => {
		let element = document.createElement("div");
		element.innerHTML = `<div class="card mb-4 shadow-sm">
	                    <a class="btn text-left">
	                        <div class="card-body">
	                            <h5 class="card-title">`+event.name+`</h5>
	                            <p class="card-text">`+event.organizer.name+` | `+event.date+`</p>
	                        </div>
	                    </a>
	                </div>`;
	    
	    element.className = "col-md-12 event";
	    element.setAttribute("event-slug", event.slug);
	    element.setAttribute("organizer-slug", event.organizer.slug);

	    element.addEventListener("click", eventListener.bind(this));

	    events_list.appendChild(element);
	});
}



function eventListener({target} = false) {
	let sessions_array = [];

	if (target) {
		last_event_slug = target.closest('.event').getAttribute("event-slug");
		last_organizer_slug = target.closest('.event').getAttribute("organizer-slug");
	}
		


	document.getElementById('register').style.display = 'block';
	document.getElementById('registered_text').style.display = 'none';

	window.history.pushState(null, null, '?organizer='+last_organizer_slug+'&event='+last_event_slug);


	let url = 'http://nurbeklu.beget.tech/api/v1/organizers/'+last_organizer_slug+'/events/'+last_event_slug;

	fetch(url)
		.then(response => response.json())
		.then(data => showDetail(data));



	function showDetail(data) {
		latest_event = data;

		if (!data.id) {
			alert('404 '+data.message);
		}

		let events_list = document.getElementById('events-list');
		let detail_block = document.getElementById('detail_block');
		let sessions_table = document.getElementById('sessions-body');
		sessions_table.innerHTML = '';

		document.getElementById('detail-name').textContent = data.name;

		data.channels.forEach(channel => {
			let tr = document.createElement("tr");
			let channel_name = document.createElement("td");
			let rooms_name = document.createElement("td");
			let sessions_td = document.createElement("td");

			channel_name.className = 'channel_name';
			rooms_name.className = 'rooms_name';

			channel_name.textContent = channel.name;

			tr.appendChild(channel_name);

			channel.rooms.forEach(room => {
				rooms_name.innerHTML += '<div>'+room.name+'</div>';
				let session_div = document.createElement("div");
				session_div.className = 'session-div';

				room.sessions.forEach(session => {
					let session_elem = document.createElement("span");
					let session_position = (((new Date(session.start).getHours() * 60) -540) + (new Date(session.start).getMinutes())) *2;
					let session_width = ((((new Date(session.end).getHours() * 60) -540) + (new Date(session.end).getMinutes())) *2) - session_position;
					session_elem.className = "session";



					if (logged) {
						logged.registrations.forEach(event => {
							if (event.event.id == data.id) {
								if (session.type == 'talk') {session_elem.className = "session registered";}

								document.getElementById('register').style.display = 'none';
								document.getElementById('registered_text').style.display = 'block';

								event.session_ids.forEach(sess => {
									if (sess == session.id) {
										session_elem.className = "session registered";
									}
								})
							}
						});
					}
					

					sessions_array.push(session);
					session_elem.style.left = session_position+'px';
					session_elem.style.width = session_width+'px';
					session_elem.textContent = session.title;
					session_elem.setAttribute("session-id", session.id);
					session_elem.addEventListener("click", sessionListener.bind(this));
					session_div.appendChild(session_elem);
				});

				sessions_td.appendChild(session_div);
			});

			tr.appendChild(rooms_name);
			tr.appendChild(sessions_td);



			sessions_table.appendChild(tr);
		});

		document.getElementById('events-list').style.display = 'none';
		document.getElementById('detail-block').style.display = 'block';

		if (params.session && !target) {
			session_id = params.session;
			
			sessionListener();
		}
		if (params.reg && !target) {
			showRegister();
		}
	}




	function sessionListener({target} = false) {
		document.getElementById('session-detail').style.display = 'block';
		if (target) { session_id = target.getAttribute("session-id"); }

		let session = sessions_array.find(item => item.id == session_id);
		let cost = 0;
		if (session.cost > 0) {cost = session.cost}

		window.history.pushState(null, null, '?organizer='+last_organizer_slug+'&event='+last_event_slug+'&session='+session_id);

		document.getElementById('session-title').textContent = session.title;
		document.getElementById('session-description').textContent = session.description;
		document.getElementById('session-info-insert').innerHTML = session.speaker+'<br>'+session.start+'<br>'+session.end+'<br>'+session.type+'<br>'+session.cost;
	}

	document.getElementById('session_close').onclick = function() {
		document.getElementById('session-detail').style.display = 'none';
		window.history.pushState(null, null, '?organizer='+last_organizer_slug+'&event='+last_event_slug);
	}
}







function loginShow(e) {
	if (e == 'show') {
		document.getElementById('login-wrapper').style.display = 'flex';
		document.getElementById('lastname').value = '';
		document.getElementById('registration_code').value = '';
	}
	else if (e == 'close') {
		document.getElementById('login-wrapper').style.display = 'none';
		document.getElementById('login-invalid').textContent = '';
		document.getElementById('lastname').value = '';
		document.getElementById('registration_code').value = '';
	}
}




document.getElementById('login').onclick = loginFetch;

function loginFetch() {
	let lastname = document.getElementById('lastname').value;
	let code = document.getElementById('registration_code').value;



	fetch('http://nurbeklu.beget.tech/api/v1/login', {
		method: 'POST',
		body: JSON.stringify({
			lastname: lastname,
			registration_code: code
		})
	})
	.then(response => response.json())
	.then(data => loginResponse(data));
}

function loginResponse(data = false, reload) {
	if (data.token) {
		document.getElementById('login_btn').style.display = 'none';
		document.getElementById('logout_btn').style.display = 'block';
		document.getElementById('user-name').textContent = data.username;
		document.getElementById('login-wrapper').style.display = 'none';

		fetch('http://nurbeklu.beget.tech/api/v1/registrations?token='+data.token)
			.then(response => response.json())
			.then(data => registrations(data));

		function registrations(reg_data) {
			data.registrations = reg_data.registrations;
			sessionStorage.setItem("user", JSON.stringify(data));
			logged = data;

			if (reload) {
				eventListener();
			}
		}
	} 
	else {
		document.getElementById('login-invalid').textContent = 'Фамилия или регистрационный код не верны';
		if (reload) {
				eventListener();
			}
	}
}





document.getElementById('logout_btn').onclick = function () {
	sessionStorage.removeItem("user");
	logged = false;

	document.getElementById('login_btn').style.display = 'block';
	document.getElementById('logout_btn').style.display = 'none';
	document.getElementById('user-name').textContent = '';
	document.getElementById('login-wrapper').style.display = 'none';
}








document.getElementById('register').onclick = showRegister;

function showRegister() {
	if (logged) {
		window.history.pushState(null, null, '?organizer='+last_organizer_slug+'&event='+last_event_slug+'&reg=true');
		document.getElementById('register-close').onclick = function () {
			document.getElementById('register-block').style.display = 'none';
			window.history.pushState(null, null, '?organizer='+last_organizer_slug+'&event='+last_event_slug);
		}

		document.getElementById('register-title').textContent = latest_event.name;
		document.getElementById('register-tickets').innerHTML = '';
		document.getElementById('workshops-insert').innerHTML = '';
		document.getElementById('ticket-cost').innerHTML = '0';
		document.getElementById('workshops-cost').innerHTML = '0';
		document.getElementById('total-cost').innerHTML = '0';
		document.getElementById('purchase').disabled = true;

		ticket_cost = 0;
		workshops_cost = 0;
		registration_fetch.ticket_id = false;
		registration_fetch.session_ids = [];


		latest_event.tickets.forEach(ticket => {
			let description = '';
			let available = '';
			let disabled = '';
			if (ticket.description) {description = ticket.description;}
			if (ticket.available == false) {
				available = ' unavailable';
				disabled = 'disabled';
				description = 'unavailable';
			}

			document.getElementById('register-tickets').innerHTML += `<div class="ticket`+available+`">
				<input type="checkbox" `+disabled+` cost="`+ticket.cost+`" id="`+ticket.id+`" onchange="costCalc('ticket',this);">
				<div style="width:100%;">
					<span style="font-weight:bold;">`+ticket.name+`</span>
					<span style="font-weight:bold; float: right;">`+ticket.cost+`</span><br>
					<span>`+description+`</span>
				</div>
			</div>`;
		});



		latest_event.channels.forEach(channel => {
			channel.rooms.forEach(room => {
				room.sessions.forEach(session => {
					if (session.type == 'workshop') {
						document.getElementById('workshops-insert').innerHTML += `<div>
							<input type="checkbox" cost="`+session.cost+`" id="`+session.id+`" onchange="costCalc('session',this);">
							<span>`+session.title+`</span>
						</div>`;
					}
				})
			})
		});

		document.getElementById('register-block').style.display = 'block';
	}
	else {
		loginShow('show');
	}
	
}



let ticket_cost = 0;
let workshops_cost = 0;

function costCalc(type, checkbox) {
	if (type == 'ticket') {
		if (checkbox.checked == true) {
			registration_fetch.ticket_id = checkbox.getAttribute('id');
			ticket_cost = checkbox.getAttribute('cost');
			document.getElementById('purchase').disabled = false;
		} 
		else { 
			ticket_cost = 0; 
			document.getElementById('purchase').disabled = true;
		}
	}

	else if (type == 'session') {
		if (checkbox.checked == true) {
			registration_fetch.session_ids.push(checkbox.getAttribute('id'));
			workshops_cost += +checkbox.getAttribute('cost');
		} 
		else {
			let index = registration_fetch.session_ids.indexOf(checkbox.getAttribute('id'));
			registration_fetch.session_ids.splice(index, 1);
			workshops_cost -= checkbox.getAttribute('cost');
		}
	}

	document.getElementById('ticket-cost').textContent = +ticket_cost;
	document.getElementById('workshops-cost').textContent = +workshops_cost;
	document.getElementById('total-cost').textContent = +ticket_cost + +workshops_cost;
}





document.getElementById('purchase').onclick = function () {
		
	let params = window.location.search.replace('?','').split('&');
	params.forEach(item => {
		let a = item.split('=');
		params[a[0]] = a[1];
	});

	fetch('http://nurbeklu.beget.tech/api/v1/organizers/'+params.organizer+'/events/'+params.event+'/registration?token='+logged.token, {
		method: 'POST',
		body: JSON.stringify(registration_fetch)
	})
		.then(response => response.json())
		.then(data => ss(data));

	function ss(data) {
		if (data.message == 'Registration successful') {
			let message = document.getElementById('message');
			message.style.top = 100+'px';
			message.style.opacity = 0;

			function dd() {
            	message.style.top = -250+'px';
            	message.style.opacity = 1;
        	}
        	setTimeout(dd, 3500);

        	let object = {
        		event: latest_event,
        		session_ids: registration_fetch.session_ids
        	}
        	logged.registrations.push(object);

        	document.getElementById('register-block').style.display = 'none';
			window.history.pushState(null, null, '?organizer='+last_organizer_slug+'&event='+last_event_slug);	
			eventListener();
		} 
		else {
			alert(data.message);
		}
	}

}







let params = window.location.search.replace('?','').split('&');
params.forEach(item => {
	let a = item.split('=');
	params[a[0]] = a[1];
});


if (params.organizer && params.event) {
	last_organizer_slug = params.organizer;
	last_event_slug = params.event;

	loginResponse(logged, true);
}